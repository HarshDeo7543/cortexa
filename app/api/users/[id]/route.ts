import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server'
import { getAdminAuth } from '@/lib/firebase/admin'
import { getUserRole } from '@/lib/auth/roles'

// DELETE: Delete a reviewer account
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: targetUserId } = await params

        const user = await getAuthenticatedUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userRole = await getUserRole(user.uid)
        const targetRole = await getUserRole(targetUserId)

        // Check permissions
        if (userRole === 'admin') {
            // Admin can delete junior_reviewer and compliance_officer
            if (!['junior_reviewer', 'compliance_officer'].includes(targetRole)) {
                return NextResponse.json({ error: 'Cannot delete this user type' }, { status: 403 })
            }
        } else if (userRole === 'compliance_officer') {
            // Compliance officer can only delete junior_reviewer
            if (targetRole !== 'junior_reviewer') {
                return NextResponse.json({ error: 'You can only delete Junior Reviewer accounts' }, { status: 403 })
            }
        } else {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Delete user using Firebase Admin SDK
        const auth = getAdminAuth()
        await auth.deleteUser(targetUserId)

        return NextResponse.json({
            success: true,
            message: 'User account deleted successfully'
        })
    } catch (error) {
        console.error('Delete user error:', error)
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }
}
