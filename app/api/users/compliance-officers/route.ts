import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server'
import { listUsers } from '@/lib/firebase/admin'
import { getUserRole } from '@/lib/auth/roles'

// GET: List all compliance officers (for workflow builder)
export async function GET() {
    try {
        const user = await getAuthenticatedUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userRole = await getUserRole(user.uid)

        // Only junior reviewers and admins can view compliance officers list
        if (!['junior_reviewer', 'admin'].includes(userRole)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const allUsers = await listUsers()
        const complianceOfficers = allUsers
            .filter(u => u.role === 'compliance_officer')
            .map(u => ({
                id: u.id,
                name: u.name || u.email,
                email: u.email,
            }))

        return NextResponse.json({ officers: complianceOfficers })
    } catch (error) {
        console.error('Get compliance officers error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch compliance officers' },
            { status: 500 }
        )
    }
}
