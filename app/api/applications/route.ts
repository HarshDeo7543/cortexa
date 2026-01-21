import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server'
import { v4 as uuidv4 } from 'uuid'
import {
    createApplication,
    getApplicationsByUser,
    getAllApplications,
    type Application
} from '@/lib/aws/dynamodb'
import { getUserRole } from '@/lib/auth/roles'
import {
    getFromCache,
    setInCache,
    deleteFromCache,
    CACHE_KEYS,
    CACHE_TTL
} from '@/lib/cache/redis'

// POST: Create new application
export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        // Validate required fields
        const requiredFields = [
            'fullName', 'fatherHusbandName', 'age', 'phone', 'email',
            'address', 'aadharNumber', 'digitalSignature', 'documentType',
            'requiredByDate', 's3Key', 'fileName', 'fileSize'
        ]

        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { error: `Missing required field: ${field}` },
                    { status: 400 }
                )
            }
        }

        // Create application
        const application: Application = {
            id: uuidv4(),
            userId: user.uid,
            fullName: body.fullName,
            fatherHusbandName: body.fatherHusbandName,
            age: body.age,
            phone: body.phone,
            email: body.email,
            address: body.address,
            aadharNumber: body.aadharNumber,
            digitalSignature: body.digitalSignature,
            documentType: body.documentType,
            requiredByDate: body.requiredByDate,
            governmentDepartment: body.governmentDepartment || undefined,
            s3Key: body.s3Key,
            fileName: body.fileName,
            fileSize: body.fileSize,
            status: 'submitted',
            currentStep: 1,
            reviews: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        await createApplication(application)

        // Invalidate user's applications cache
        await deleteFromCache(CACHE_KEYS.applicationsList(user.uid, 'user'))

        return NextResponse.json({
            success: true,
            applicationId: application.id
        })
    } catch (error) {
        console.error('Create application error:', error)
        return NextResponse.json(
            { error: 'Failed to create application' },
            { status: 500 }
        )
    }
}

// GET: List applications (filtered by role)
export async function GET(request: Request) {
    try {
        const user = await getAuthenticatedUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userRole = await getUserRole(user.uid)
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        // Try to get from cache first (only for user's own applications without status filter)
        const cacheKey = CACHE_KEYS.applicationsList(user.uid, userRole)
        if (!status || status === 'all') {
            const cached = await getFromCache<Application[]>(cacheKey)
            if (cached) {
                return NextResponse.json({ applications: cached, cached: true })
            }
        }

        let applications: Application[]

        if (userRole === 'admin' || userRole === 'junior_reviewer' || userRole === 'compliance_officer') {
            // Admin and reviewers see all applications
            // This allows dashboard to show complete stats
            applications = await getAllApplications()
        } else {
            // Regular users see only their own applications
            applications = await getApplicationsByUser(user.uid)
        }

        // Filter by status if provided
        if (status && status !== 'all') {
            applications = applications.filter(app => app.status === status)
        }

        // Sort by newest first
        applications.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        // Cache the unfiltered results
        if (!status || status === 'all') {
            await setInCache(cacheKey, applications, CACHE_TTL.APPLICATIONS_LIST)
        }

        return NextResponse.json({ applications })
    } catch (error) {
        console.error('Get applications error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch applications' },
            { status: 500 }
        )
    }
}
