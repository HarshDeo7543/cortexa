import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
    DynamoDBDocumentClient,
    PutCommand,
    QueryCommand,
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

export const LOGS_TABLE_NAME = process.env.AWS_DYNAMODB_LOGS_TABLE || 'cortexa-activity-logs'

// Activity log types
export type ActivityType =
    | 'application_reviewed'
    | 'application_approved'
    | 'application_rejected'
    | 'user_role_changed'
    | 'document_signed'
    | 'login'

export interface ActivityLog {
    id: string
    timestamp: string
    actorId: string
    actorName: string
    actorRole: string
    actorEmail: string
    actionType: ActivityType
    targetType: 'application' | 'user' | 'document'
    targetId: string
    targetName?: string
    details: string
    metadata?: Record<string, string | number | boolean>
}

// Create activity log entry
export async function createActivityLog(log: ActivityLog): Promise<void> {
    try {
        const client = getDynamoClient()
        await client.send(new PutCommand({
            TableName: LOGS_TABLE_NAME,
            Item: log,
        }))
        console.log(`[ActivityLog] Created: ${log.actionType} by ${log.actorEmail}`)
    } catch (error) {
        // Don't fail the main operation if logging fails
        console.error('[ActivityLog] Failed to create log:', error)
    }
}

// Get all activity logs (for admin)
export async function getAllActivityLogs(limit: number = 100): Promise<ActivityLog[]> {
    const client = getDynamoClient()
    const result = await client.send(new ScanCommand({
        TableName: LOGS_TABLE_NAME,
        Limit: limit,
    }))

    // Sort by timestamp descending (most recent first)
    const logs = (result.Items as ActivityLog[]) || []
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// Get activity logs by actor (reviewer)
export async function getActivityLogsByActor(actorId: string): Promise<ActivityLog[]> {
    const client = getDynamoClient()
    const result = await client.send(new ScanCommand({
        TableName: LOGS_TABLE_NAME,
        FilterExpression: 'actorId = :actorId',
        ExpressionAttributeValues: {
            ':actorId': actorId,
        },
    }))

    const logs = (result.Items as ActivityLog[]) || []
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// Get activity logs by action type
export async function getActivityLogsByType(actionType: ActivityType): Promise<ActivityLog[]> {
    const client = getDynamoClient()
    const result = await client.send(new ScanCommand({
        TableName: LOGS_TABLE_NAME,
        FilterExpression: 'actionType = :actionType',
        ExpressionAttributeValues: {
            ':actionType': actionType,
        },
    }))

    const logs = (result.Items as ActivityLog[]) || []
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// Helper to generate log ID
export function generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}
