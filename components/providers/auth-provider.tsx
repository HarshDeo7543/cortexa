"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import {
    signInWithGoogle as firebaseSignInWithGoogle,
    signInWithEmail as firebaseSignInWithEmail,
    signUpWithEmail as firebaseSignUpWithEmail,
    signOut as firebaseSignOut,
    onAuthChange,
    getIdTokenResult,
    type User,
    type AuthError,
} from "@/lib/firebase/client"
import { useRouter } from "next/navigation"

interface AuthContextType {
    user: User | null
    loading: boolean
    role: string | null
    signInWithGoogle: (callbackUrl?: string) => Promise<void>
    signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>
    signUpWithEmail: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>
    signOut: () => Promise<void>
    refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [role, setRole] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    // Fetch user role from custom claims
    const fetchUserRole = async () => {
        const result = await getIdTokenResult()
        if (result?.claims?.role) {
            setRole(result.claims.role)
        } else {
            setRole('user') // Default role
        }
    }

    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = onAuthChange(async (firebaseUser) => {
            setUser(firebaseUser)
            if (firebaseUser) {
                await fetchUserRole()
            } else {
                setRole(null)
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const signInWithGoogle = async (callbackUrl?: string) => {
        try {
            const { user, error } = await firebaseSignInWithGoogle()
            if (error) {
                console.error("Google sign in error:", error)
                return
            }
            if (user) {
                // Create server-side session
                const idToken = await user.getIdToken()
                await fetch('/api/auth/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken }),
                })
                await fetchUserRole()
                router.push(callbackUrl || '/dashboard')
                router.refresh()
            }
        } catch (error) {
            console.error("Google sign in error:", error)
        }
    }

    const signInWithEmail = async (email: string, password: string) => {
        const { user, error } = await firebaseSignInWithEmail(email, password)
        if (!error && user) {
            // Create server-side session
            const idToken = await user.getIdToken()
            await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            })
            await fetchUserRole()
            router.refresh()
        }
        return { error }
    }

    const signUpWithEmail = async (email: string, password: string, name: string) => {
        const { error } = await firebaseSignUpWithEmail(email, password, name)
        return { error }
    }

    const signOut = async () => {
        // Delete server-side session
        await fetch('/api/auth/session', { method: 'DELETE' })
        await firebaseSignOut()
        setRole(null)
        router.push("/")
    }

    const refreshToken = async () => {
        await fetchUserRole()
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                role,
                signInWithGoogle,
                signInWithEmail,
                signUpWithEmail,
                signOut,
                refreshToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
