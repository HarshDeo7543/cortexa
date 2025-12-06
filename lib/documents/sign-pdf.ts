import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'cortexa-documents'

interface ReviewerInfo {
    juniorReviewerName: string
    complianceOfficerName: string
}

/**
 * Generate a unique verification code for the document
 */
function generateVerificationCode(applicationId: string): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    return `CRX-${applicationId.substring(0, 4).toUpperCase()}-${timestamp}-${random}`.toUpperCase()
}

/**
 * Add verification stamp to a PDF document
 * Returns the S3 key of the signed document
 */
export async function signPdfDocument(
    applicationId: string,
    s3Key: string,
    reviewerInfo: ReviewerInfo
): Promise<{ signedS3Key: string; verificationCode: string }> {
    console.log(`[PDF-Sign] Starting to sign document: ${s3Key}`)
    console.log(`[PDF-Sign] Reviewer info:`, reviewerInfo)

    try {
        // Fetch the original PDF from S3
        const getCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
        })

        console.log(`[PDF-Sign] Fetching PDF from S3 bucket: ${BUCKET_NAME}`)
        const response = await s3Client.send(getCommand)
        const pdfBytes = await response.Body?.transformToByteArray()

        if (!pdfBytes) {
            throw new Error('Failed to fetch PDF from S3')
        }

        console.log(`[PDF-Sign] PDF fetched, size: ${pdfBytes.length} bytes`)

        // Load the PDF
        const pdfDoc = await PDFDocument.load(pdfBytes)
        const pages = pdfDoc.getPages()
        const firstPage = pages[0]
        const { width, height } = firstPage.getSize()

        console.log(`[PDF-Sign] PDF loaded, page size: ${width}x${height}`)

        // Embed fonts
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)

        // Generate verification code
        const verificationCode = generateVerificationCode(applicationId)
        console.log(`[PDF-Sign] Generated verification code: ${verificationCode}`)

        // Add verification stamp box at BOTTOM RIGHT corner
        const stampWidth = 220
        const stampHeight = 90
        const stampX = width - stampWidth - 20  // Right side
        const stampY = 20  // Bottom of page

        // Draw stamp background with prominent color
        firstPage.drawRectangle({
            x: stampX,
            y: stampY,
            width: stampWidth,
            height: stampHeight,
            color: rgb(0.9, 0.95, 0.9), // Light green background
            borderColor: rgb(0.1, 0.5, 0.2),
            borderWidth: 3,
        })

        // Draw "VERIFIED" header with checkmark
        firstPage.drawText('VERIFIED', {
            x: stampX + 15,
            y: stampY + stampHeight - 22,
            size: 16,
            font: helveticaBold,
            color: rgb(0.1, 0.5, 0.2),
        })

        // Draw separator line
        firstPage.drawLine({
            start: { x: stampX + 10, y: stampY + stampHeight - 28 },
            end: { x: stampX + stampWidth - 10, y: stampY + stampHeight - 28 },
            thickness: 1.5,
            color: rgb(0.1, 0.5, 0.2),
        })

        // Draw approval details
        const approvalDate = new Date().toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })

        firstPage.drawText(`Jr. Reviewer: ${reviewerInfo.juniorReviewerName}`, {
            x: stampX + 10,
            y: stampY + stampHeight - 45,
            size: 8,
            font: helvetica,
            color: rgb(0.2, 0.2, 0.2),
        })

        firstPage.drawText(`CO: ${reviewerInfo.complianceOfficerName}`, {
            x: stampX + 10,
            y: stampY + stampHeight - 57,
            size: 8,
            font: helvetica,
            color: rgb(0.2, 0.2, 0.2),
        })

        firstPage.drawText(`Date: ${approvalDate}`, {
            x: stampX + 10,
            y: stampY + stampHeight - 69,
            size: 8,
            font: helvetica,
            color: rgb(0.2, 0.2, 0.2),
        })

        // Draw verification code
        firstPage.drawText(verificationCode, {
            x: stampX + 10,
            y: stampY + 8,
            size: 7,
            font: helveticaBold,
            color: rgb(0.3, 0.3, 0.3),
        })

        // Save the signed PDF
        const signedPdfBytes = await pdfDoc.save()
        console.log(`[PDF-Sign] PDF modified, new size: ${signedPdfBytes.length} bytes`)

        // Upload signed document to S3 with a new key
        const signedS3Key = s3Key.replace(/\.pdf$/i, '_VERIFIED.pdf')

        const putCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: signedS3Key,
            Body: Buffer.from(signedPdfBytes),
            ContentType: 'application/pdf',
            Metadata: {
                'original-key': s3Key,
                'application-id': applicationId,
                'verification-code': verificationCode,
                'signed-date': new Date().toISOString(),
            },
        })

        await s3Client.send(putCommand)

        console.log(`[PDF-Sign] SUCCESS! Signed document uploaded: ${signedS3Key}`)

        return {
            signedS3Key,
            verificationCode,
        }
    } catch (error) {
        console.error('[PDF-Sign] ERROR signing document:', error)
        throw error
    }
}

