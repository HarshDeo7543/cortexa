import { cookies } from 'next/headers'
import { verifySessionCookie } from './admin'

// Get authenticated user from session cookie (for API routes and server components)
export async function getAuthenticatedUser(): Promise<{
    uid: string
    email?: string
    displayName?: string
} | null> {
    try {
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get('__session')?.value

        if (!sessionCookie) {
            return null
        }

        const decodedToken = await verifySessionCookie(sessionCookie)

        if (!decodedToken) {
            return null
        }

        return {
            uid: decodedToken.uid,
            email: decodedToken.email,
            displayName: decodedToken.name as string | undefined,
        }
    } catch (error) {
        console.error('Auth verification error:', error)
        return null
    }
}
