import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserRole, isAdmin, isComplianceOfficer } from '@/lib/auth/roles'

// GET: List all users with their roles (admin/compliance only)
export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userRole = await getUserRole(user.id)

        // Only admin and compliance officer can view users
        if (!['admin', 'compliance_officer'].includes(userRole)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Get all users with roles
        const { data: roles, error } = await supabase
            .from('user_roles')
            .select('user_id, role, created_at')
            .order('created_at', { ascending: false })

        if (error) {
            throw error
        }

        // Get user emails from auth (admin API not available on client, so we store email in metadata)
        const users = roles?.map(r => ({
            id: r.user_id,
            role: r.role,
            createdAt: r.created_at,
        })) || []

        // Filter based on role permissions
        let filteredUsers = users
        if (userRole === 'compliance_officer') {
            // Compliance officer can only see junior reviewers
            filteredUsers = users.filter(u => u.role === 'junior_reviewer')
        } else if (userRole === 'admin') {
            // Admin can see junior reviewers and compliance officers (not normal users)
            filteredUsers = users.filter(u => ['junior_reviewer', 'compliance_officer'].includes(u.role))
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
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userRole = await getUserRole(user.id)
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

        // Create user using Supabase Auth admin (sign up)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    full_name: name,
                },
            },
        })

        if (signUpError) {
            return NextResponse.json({ error: signUpError.message }, { status: 400 })
        }

        if (!signUpData.user) {
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
        }

        // Update the role (trigger creates default 'user' role, we need to update it)
        const { error: updateError } = await supabase
            .from('user_roles')
            .update({ role })
            .eq('user_id', signUpData.user.id)

        if (updateError) {
            // If update fails, try insert
            await supabase
                .from('user_roles')
                .insert({ user_id: signUpData.user.id, role })
        }

        return NextResponse.json({
            success: true,
            userId: signUpData.user.id,
            message: `${role.replace('_', ' ')} account created successfully`
        })
    } catch (error) {
        console.error('Create user error:', error)
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }
}
