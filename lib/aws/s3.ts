import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// S3 Client singleton
let s3Client: S3Client | null = null

export function getS3Client(): S3Client {
    if (!s3Client) {
        s3Client = new S3Client({
            region: process.env.AWS_REGION || 'ap-south-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        })
    }
    return s3Client
}

export const S3_BUCKET = process.env.AWS_S3_BUCKET || 'cortexa-documents'

// Generate presigned URL for uploading
export async function getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
): Promise<string> {
    const client = getS3Client()
    const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        ContentType: contentType,
    })
    return getSignedUrl(client, command, { expiresIn })
}

// Generate presigned URL for downloading
export async function getPresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600
): Promise<string> {
    const client = getS3Client()
    const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
    })
    return getSignedUrl(client, command, { expiresIn })
}

// Delete object from S3
export async function deleteObject(key: string): Promise<void> {
    const client = getS3Client()
    const command = new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
    })
    await client.send(command)
}

// Generate unique S3 key for document
export function generateS3Key(userId: string, fileName: string): string {
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    return `documents/${userId}/${timestamp}-${sanitizedFileName}`
}
