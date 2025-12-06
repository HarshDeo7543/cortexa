import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPresignedUploadUrl, generateS3Key } from '@/lib/aws/s3'

export async function POST(request: Request) {
    try {
        // Check authentication
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { fileName, contentType, fileSize } = await request.json()

        // Validate file type
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if (!allowedTypes.includes(contentType)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only PDF and DOCX files are allowed.' },
                { status: 400 }
            )
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024
        if (fileSize > maxSize) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 10MB.' },
                { status: 400 }
            )
        }

        // Generate S3 key and presigned URL
        const s3Key = generateS3Key(user.id, fileName)
        const uploadUrl = await getPresignedUploadUrl(s3Key, contentType)

        return NextResponse.json({
            uploadUrl,
            s3Key,
        })
    } catch (error) {
        console.error('Upload API error:', error)
        return NextResponse.json(
            { error: 'Failed to generate upload URL' },
            { status: 500 }
        )
    }
}
