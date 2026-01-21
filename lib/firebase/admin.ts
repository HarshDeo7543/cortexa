import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getAuth, type Auth, type DecodedIdToken } from 'firebase-admin/auth'

let adminApp: App | undefined
let adminAuth: Auth | undefined

function getAdminApp(): App {
    if (adminApp) return adminApp

    if (getApps().length > 0) {
        adminApp = getApps()[0]
        return adminApp
    }

    // Initialize with service account credentials
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

    adminApp = initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: privateKey,
        }),
    })

    return adminApp
}

function getAdminAuth(): Auth {
    if (adminAuth) return adminAuth
    adminAuth = getAuth(getAdminApp())
    return adminAuth
}

// Verify ID token from client
export async function verifyIdToken(token: string): Promise<DecodedIdToken | null> {
    try {
        const auth = getAdminAuth()
        return await auth.verifyIdToken(token)
    } catch (error) {
        console.error('Error verifying ID token:', error)
        return null
    }
}

// Get user by UID
export async function getUser(uid: string) {
    try {
        const auth = getAdminAuth()
        return await auth.getUser(uid)
    } catch (error) {
        console.error('Error getting user:', error)
        return null
    }
}

// Set custom claims (for roles)
export async function setUserRole(uid: string, role: string): Promise<boolean> {
    try {
        const auth = getAdminAuth()
        await auth.setCustomUserClaims(uid, { role })
        return true
    } catch (error) {
        console.error('Error setting user role:', error)
        return false
    }
}

// Get user's custom claims
export async function getUserRole(uid: string): Promise<string | null> {
    try {
        const auth = getAdminAuth()
        const user = await auth.getUser(uid)
        return (user.customClaims?.role as string) || 'user'
    } catch (error) {
        console.error('Error getting user role:', error)
        return null
    }
}

// Get all users (for admin panel)
export async function listUsers(maxResults: number = 1000): Promise<Array<{
    id: string
    email: string
    name: string
    role: string
}>> {
    try {
        const auth = getAdminAuth()
        const listResult = await auth.listUsers(maxResults)
        return listResult.users.map((user: {
            uid: string
            email?: string
            displayName?: string
            customClaims?: Record<string, unknown>
        }) => ({
            id: user.uid,
            email: user.email || '',
            name: user.displayName || '',
            role: (user.customClaims?.role as string) || 'user',
        }))
    } catch (error) {
        console.error('Error listing users:', error)
        return []
    }
}

// Create a session cookie
export async function createSessionCookie(idToken: string, expiresIn: number = 60 * 60 * 24 * 5 * 1000) {
    try {
        const auth = getAdminAuth()
        return await auth.createSessionCookie(idToken, { expiresIn })
    } catch (error) {
        console.error('Error creating session cookie:', error)
        return null
    }
}

// Verify session cookie
export async function verifySessionCookie(cookie: string): Promise<DecodedIdToken | null> {
    try {
        const auth = getAdminAuth()
        return await auth.verifySessionCookie(cookie, true)
    } catch (error) {
        console.error('Error verifying session cookie:', error)
        return null
    }
}

export { getAdminAuth }
