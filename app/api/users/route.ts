import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server'
import { listUsers, setUserRole, getAdminAuth } from '@/lib/firebase/admin'
import { getUserRole } from '@/lib/auth/roles'

// GET: List all users with their roles (admin/compliance only)
export async function GET(request: Request) {
    try {
        const user = await getAuthenticatedUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userRole = await getUserRole(user.uid)

        // Only admin and compliance officer can view users
        if (!['admin', 'compliance_officer'].includes(userRole)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Get all users from Firebase
        const allUsers = await listUsers()

        // Filter based on role permissions
        let filteredUsers = allUsers
        if (userRole === 'compliance_officer') {
            // Compliance officer can only see junior reviewers
            filteredUsers = allUsers.filter(u => u.role === 'junior_reviewer')
        } else if (userRole === 'admin') {
            // Admin can see junior reviewers and compliance officers (not normal users)
            filteredUsers = allUsers.filter(u => ['junior_reviewer', 'compliance_officer'].includes(u.role))
        }

        return NextResponse.json({ users: filteredUsers })
    } catch (error) {
        console.error('Get users error:', error)
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
}

// POST: Create new reviewer account
export async function POST(request: Request) {
    try {
        const currentUser = await getAuthenticatedUser()

        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userRole = await getUserRole(currentUser.uid)
        const body = await request.json()
        const { email, password, name, role } = body

        // Validate inputs
        if (!email || !password || !name || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Check permissions
        if (userRole === 'admin') {
            // Admin can create junior_reviewer and compliance_officer
            if (!['junior_reviewer', 'compliance_officer'].includes(role)) {
                return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
            }
        } else if (userRole === 'compliance_officer') {
            // Compliance officer can only create junior_reviewer
            if (role !== 'junior_reviewer') {
                return NextResponse.json({ error: 'You can only create Junior Reviewer accounts' }, { status: 403 })
            }
        } else {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Create user using Firebase Admin SDK
        const auth = getAdminAuth()
        const newUser = await auth.createUser({
            email,
            password,
            displayName: name,
        })

        // Set the role as custom claim
        await setUserRole(newUser.uid, role)

        return NextResponse.json({
            success: true,
            userId: newUser.uid,
            message: `${role.replace('_', ' ')} account created successfully`
        })
    } catch (error: any) {
        console.error('Create user error:', error)
        if (error.code === 'auth/email-already-exists') {
            return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }
}
