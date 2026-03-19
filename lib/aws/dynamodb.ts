import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand,
    QueryCommand,
    UpdateCommand,
    ScanCommand,
} from '@aws-sdk/lib-dynamodb'

// DynamoDB Client singleton
let dynamoClient: DynamoDBDocumentClient | null = null

export function getDynamoClient(): DynamoDBDocumentClient {
    if (!dynamoClient) {
        const client = new DynamoDBClient({
            region: process.env.AWS_REGION || 'ap-south-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        })
        dynamoClient = DynamoDBDocumentClient.from(client, {
            marshallOptions: {
                removeUndefinedValues: true,
            },
        })
    }
    return dynamoClient
}

export const TABLE_NAME = process.env.AWS_DYNAMODB_TABLE || 'cortexa-applications'

// Application status types
export type ApplicationStatus =
    | 'submitted'
    | 'junior_review'
    | 'compliance_review'
    | 'approved'
    | 'rejected'
    | 'rolled_back'

// Workflow step — one compliance officer in the review chain
export interface WorkflowStep {
    officerId: string
    officerName: string
    officerEmail: string
    status: 'pending' | 'approved' | 'rejected' | 'skipped'
    comment?: string
    reviewedAt?: string
}

// Document version history entry
export interface DocumentVersion {
    versionNumber: number
    s3Key: string
    signedS3Key?: string
    verificationCode?: string
    createdAt: string
    createdBy: string
    rolledBackAt?: string
    rolledBackBy?: string
    rollbackReason?: string
}

// Substitution / reassignment request
export interface SubstitutionRequest {
    id: string
    requestedBy: string
    requestedByName: string
    requestedByEmail: string
    assignedTo: string
    assignedToName: string
    assignedToEmail: string
    reason: string
    status: 'pending' | 'accepted' | 'rejected'
    workflowStepIndex: number
    createdAt: string
    respondedAt?: string
    responseComment?: string
}

// Review record
export interface Review {
    reviewerRole: 'junior_reviewer' | 'compliance_officer'
    reviewerId: string
    reviewerName: string
    action: 'approved' | 'rejected'
    comment?: string
    timestamp: string
}

// Application schema
export interface Application {
    id: string

    // Applicant Info
    userId: string
    fullName: string
    fatherHusbandName: string
    age: number
    phone: string
    email: string
    address: string
    aadharNumber: string
    digitalSignature: string

    // Document Info
    documentType: string
    requiredByDate: string
    governmentDepartment?: string
    s3Key: string
    fileName: string
    fileSize: number

    // Signed Document (after approval)
    signedS3Key?: string
    verificationCode?: string

    // Workflow
    status: ApplicationStatus
    currentStep: number

    // Multi-officer workflow (set by junior reviewer)
    workflow?: WorkflowStep[]
    workflowCurrentIndex?: number

    // Document version history
    versions?: DocumentVersion[]

    // Substitution / reassignment requests
    substitutionRequests?: SubstitutionRequest[]

    // Junior reviewer who defined the workflow
    juniorReviewerId?: string
    juniorReviewerName?: string
    juniorReviewerEmail?: string

    // Review History
    reviews: Review[]

    // Timestamps
    createdAt: string
    updatedAt: string
}

// Create new application
export async function createApplication(application: Application): Promise<void> {
    const client = getDynamoClient()
    await client.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: application,
    }))
}

// Get application by ID
export async function getApplication(id: string): Promise<Application | null> {
    const client = getDynamoClient()
    const result = await client.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { id },
    }))
    return (result.Item as Application) || null
}

// Get applications by user ID
export async function getApplicationsByUser(userId: string): Promise<Application[]> {
    const client = getDynamoClient()
    const result = await client.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId,
        },
    }))
    return (result.Items as Application[]) || []
}

// Get applications by status (for reviewers)
export async function getApplicationsByStatus(status: ApplicationStatus): Promise<Application[]> {
    const client = getDynamoClient()
    const result = await client.send(new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: {
            '#status': 'status',
        },
        ExpressionAttributeValues: {
            ':status': status,
        },
    }))
    return (result.Items as Application[]) || []
}

// Get all applications (for admin)
export async function getAllApplications(): Promise<Application[]> {
    const client = getDynamoClient()
    const result = await client.send(new ScanCommand({
        TableName: TABLE_NAME,
    }))
    return (result.Items as Application[]) || []
}

// Update application status and add review
export async function updateApplicationReview(
    id: string,
    newStatus: ApplicationStatus,
    review: Review,
    currentStep: number
): Promise<void> {
    const client = getDynamoClient()
    await client.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: 'SET #status = :status, currentStep = :step, reviews = list_append(reviews, :review), updatedAt = :updatedAt',
        ExpressionAttributeNames: {
            '#status': 'status',
        },
        ExpressionAttributeValues: {
            ':status': newStatus,
            ':step': currentStep,
            ':review': [review],
            ':updatedAt': new Date().toISOString(),
        },
    }))
}

// Update application for resubmission
export async function resubmitApplication(
    id: string,
    s3Key: string,
    fileName: string,
    fileSize: number
): Promise<void> {
    const client = getDynamoClient()
    await client.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: 'SET #status = :status, currentStep = :step, s3Key = :s3Key, fileName = :fileName, fileSize = :fileSize, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
            '#status': 'status',
        },
        ExpressionAttributeValues: {
            ':status': 'submitted',
            ':step': 1,
            ':s3Key': s3Key,
            ':fileName': fileName,
            ':fileSize': fileSize,
            ':updatedAt': new Date().toISOString(),
        },
    }))
}

// Update application with signed document info
export async function updateApplicationSignedDocument(
    id: string,
    signedS3Key: string,
    verificationCode: string
): Promise<void> {
    const client = getDynamoClient()
    await client.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: 'SET signedS3Key = :signedS3Key, verificationCode = :verificationCode, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
            ':signedS3Key': signedS3Key,
            ':verificationCode': verificationCode,
            ':updatedAt': new Date().toISOString(),
        },
    }))
}

// Set the multi-officer workflow for an application (junior reviewer defines this)
export async function updateApplicationWorkflow(
    id: string,
    workflow: WorkflowStep[],
    juniorReviewerId: string,
    juniorReviewerName: string,
    juniorReviewerEmail: string
): Promise<void> {
    const client = getDynamoClient()
    await client.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: 'SET #status = :status, currentStep = :step, workflow = :workflow, workflowCurrentIndex = :idx, juniorReviewerId = :jrId, juniorReviewerName = :jrName, juniorReviewerEmail = :jrEmail, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
            '#status': 'status',
        },
        ExpressionAttributeValues: {
            ':status': 'compliance_review' as ApplicationStatus,
            ':step': 2,
            ':workflow': workflow,
            ':idx': 0,
            ':jrId': juniorReviewerId,
            ':jrName': juniorReviewerName,
            ':jrEmail': juniorReviewerEmail,
            ':updatedAt': new Date().toISOString(),
        },
    }))
}

// Update a specific workflow step and advance the index
export async function updateWorkflowStep(
    id: string,
    workflow: WorkflowStep[],
    workflowCurrentIndex: number,
    newStatus: ApplicationStatus,
    currentStep: number
): Promise<void> {
    const client = getDynamoClient()
    await client.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: 'SET workflow = :workflow, workflowCurrentIndex = :idx, #status = :status, currentStep = :step, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
            '#status': 'status',
        },
        ExpressionAttributeValues: {
            ':workflow': workflow,
            ':idx': workflowCurrentIndex,
            ':status': newStatus,
            ':step': currentStep,
            ':updatedAt': new Date().toISOString(),
        },
    }))
}

// Rollback: save version and reset status
export async function rollbackApplication(
    id: string,
    versions: DocumentVersion[],
    newStatus: ApplicationStatus,
    workflow: WorkflowStep[],
    workflowCurrentIndex: number
): Promise<void> {
    const client = getDynamoClient()
    await client.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: 'SET #status = :status, versions = :versions, signedS3Key = :signed, verificationCode = :vc, workflow = :workflow, workflowCurrentIndex = :idx, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
            '#status': 'status',
        },
        ExpressionAttributeValues: {
            ':status': newStatus,
            ':versions': versions,
            ':signed': null,
            ':vc': null,
            ':workflow': workflow,
            ':idx': workflowCurrentIndex,
            ':updatedAt': new Date().toISOString(),
        },
    }))
}

// Add a substitution request
export async function addSubstitutionRequest(
    id: string,
    requests: SubstitutionRequest[]
): Promise<void> {
    const client = getDynamoClient()
    await client.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: 'SET substitutionRequests = :requests, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
            ':requests': requests,
            ':updatedAt': new Date().toISOString(),
        },
    }))
}

// Update substitution request status and optionally update workflow
export async function updateSubstitutionAndWorkflow(
    id: string,
    requests: SubstitutionRequest[],
    workflow?: WorkflowStep[]
): Promise<void> {
    const client = getDynamoClient()
    const updateExpression = workflow
        ? 'SET substitutionRequests = :requests, workflow = :workflow, updatedAt = :updatedAt'
        : 'SET substitutionRequests = :requests, updatedAt = :updatedAt'

    const expressionValues: Record<string, unknown> = {
        ':requests': requests,
        ':updatedAt': new Date().toISOString(),
    }
    if (workflow) {
        expressionValues[':workflow'] = workflow
    }

    await client.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionValues,
    }))
}
