import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSessionCookie, verifyIdToken, setUserRole } from '@/lib/firebase/admin'

export async function POST(request: Request) {
    try {
        const { idToken } = await request.json()

        if (!idToken) {
            return NextResponse.json({ error: 'Missing ID token' }, { status: 400 })
        }

        // Verify the ID token
        const decodedToken = await verifyIdToken(idToken)

        if (!decodedToken) {
            return NextResponse.json({ error: 'Invalid ID token' }, { status: 401 })
        }

        // Check if this is a new user (no role set yet)
        if (!decodedToken.role) {
            // Set default role for new users
            await setUserRole(decodedToken.uid, 'user')
        }

        // Create a session cookie (5 days expiry)
        const expiresIn = 60 * 60 * 24 * 5 * 1000
        const sessionCookie = await createSessionCookie(idToken, expiresIn)

        if (!sessionCookie) {
            return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
        }

        // Set the session cookie
        const cookieStore = await cookies()
        cookieStore.set('__session', sessionCookie, {
            maxAge: expiresIn / 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Session creation error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE() {
    try {
        // Clear the session cookie
        const cookieStore = await cookies()
        cookieStore.delete('__session')

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Session deletion error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
