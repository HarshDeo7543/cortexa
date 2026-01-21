import {
    getAuth,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    onAuthStateChanged,
    updateProfile,
    type User,
    type AuthError,
} from 'firebase/auth'
import { app } from './config'

// Get auth instance
const auth = getAuth(app)

// Google Auth Provider
const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
    prompt: 'select_account'
})

// Sign in with Google
export async function signInWithGoogle(): Promise<{ user: User | null; error: AuthError | null }> {
    try {
        const result = await signInWithPopup(auth, googleProvider)
        return { user: result.user, error: null }
    } catch (error) {
        return { user: null, error: error as AuthError }
    }
}

// Sign in with email and password
export async function signInWithEmail(
    email: string,
    password: string
): Promise<{ user: User | null; error: AuthError | null }> {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password)
        return { user: result.user, error: null }
    } catch (error) {
        return { user: null, error: error as AuthError }
    }
}

// Sign up with email and password
export async function signUpWithEmail(
    email: string,
    password: string,
    displayName: string
): Promise<{ user: User | null; error: AuthError | null }> {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password)
        // Update user profile with display name
        await updateProfile(result.user, { displayName })
        return { user: result.user, error: null }
    } catch (error) {
        return { user: null, error: error as AuthError }
    }
}

// Sign out
export async function signOut(): Promise<void> {
    await firebaseSignOut(auth)
}

// Subscribe to auth state changes
export function onAuthChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback)
}

// Get current user
export function getCurrentUser(): User | null {
    return auth.currentUser
}

// Get ID token for server-side verification
export async function getIdToken(): Promise<string | null> {
    const user = auth.currentUser
    if (!user) return null
    return user.getIdToken()
}

// Get ID token with custom claims (for role checking)
export async function getIdTokenResult(): Promise<{
    token: string
    claims: { role?: string }
} | null> {
    const user = auth.currentUser
    if (!user) return null
    const result = await user.getIdTokenResult()
    return {
        token: result.token,
        claims: result.claims as { role?: string }
    }
}

export { auth }
export type { User, AuthError }
