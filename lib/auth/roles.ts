import { getUserRole as getFirebaseUserRole, setUserRole as setFirebaseUserRole, listUsers } from '@/lib/firebase/admin'
import { getCachedUserRole, setCachedUserRole } from '@/lib/cache/redis'

export type UserRole = 'user' | 'junior_reviewer' | 'compliance_officer' | 'admin'

export interface UserWithRole {
    id: string
    email: string
    name?: string
    role: UserRole
}

// Get current user's role from cache or Firebase custom claims
export async function getUserRole(userId: string): Promise<UserRole> {
    // Try cache first
    const cachedRole = await getCachedUserRole(userId)
    if (cachedRole) {
        return cachedRole as UserRole
    }

    // Fallback to Firebase Admin
    const role = await getFirebaseUserRole(userId)

    if (!role) {
        return 'user' // Default role
    }

    // Cache the role for next time
    await setCachedUserRole(userId, role)

    return role as UserRole
}

// Check if user has specific role
export async function hasRole(userId: string, requiredRole: UserRole): Promise<boolean> {
    const userRole = await getUserRole(userId)

    // Admin has access to everything
    if (userRole === 'admin') return true

    return userRole === requiredRole
}

// Check if user can review (junior_reviewer, compliance_officer, or admin)
export async function canReview(userId: string): Promise<boolean> {
    const userRole = await getUserRole(userId)
    return ['junior_reviewer', 'compliance_officer', 'admin'].includes(userRole)
}

// Check if user is junior reviewer
export async function isJuniorReviewer(userId: string): Promise<boolean> {
    const userRole = await getUserRole(userId)
    return userRole === 'junior_reviewer' || userRole === 'admin'
}

// Check if user is compliance officer
export async function isComplianceOfficer(userId: string): Promise<boolean> {
    const userRole = await getUserRole(userId)
    return userRole === 'compliance_officer' || userRole === 'admin'
}

// Check if user is admin
export async function isAdmin(userId: string): Promise<boolean> {
    const userRole = await getUserRole(userId)
    return userRole === 'admin'
}

// Update user role (admin only) - Uses Firebase Custom Claims
export async function updateUserRole(userId: string, newRole: UserRole): Promise<boolean> {
    const success = await setFirebaseUserRole(userId, newRole)

    if (success) {
        // Update cache
        await setCachedUserRole(userId, newRole)
    }

    return success
}

// Get all users with roles (admin only)
export async function getAllUsersWithRoles(): Promise<UserWithRole[]> {
    const users = await listUsers()

    return users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserRole,
    }))
}
