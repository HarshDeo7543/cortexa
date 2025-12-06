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
        dynamoClient = DynamoDBDocumentClient.from(client)
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
