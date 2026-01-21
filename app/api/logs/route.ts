import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/firebase/server'
import { getAllActivityLogs, getActivityLogsByActor, getActivityLogsByType, type ActivityType } from '@/lib/aws/activity-logs'
import { isAdmin } from '@/lib/auth/roles'

// GET: Get activity logs (admin only)
export async function GET(request: Request) {
    try {
        const user = await getAuthenticatedUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Only admin can view logs
        const userIsAdmin = await isAdmin(user.uid)
        if (!userIsAdmin) {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const actorId = searchParams.get('actorId')
        const actionType = searchParams.get('actionType')

        let logs
        if (actorId) {
            logs = await getActivityLogsByActor(actorId)
        } else if (actionType) {
            logs = await getActivityLogsByType(actionType as ActivityType)
        } else {
            logs = await getAllActivityLogs(200)
        }

        return NextResponse.json({ logs })
    } catch (error) {
        console.error('Get activity logs error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch activity logs' },
            { status: 500 }
        )
    }
}
