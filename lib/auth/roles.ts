import { createClient } from '@/lib/supabase/server'

export type UserRole = 'user' | 'junior_reviewer' | 'compliance_officer' | 'admin'

export interface UserWithRole {
    id: string
    email: string
    name?: string
    role: UserRole
}

// Get current user's role from Supabase
export async function getUserRole(userId: string): Promise<UserRole> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single()

    if (error || !data) {
        return 'user' // Default role
    }

    return data.role as UserRole
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

// Update user role (admin only)
export async function updateUserRole(userId: string, newRole: UserRole): Promise<boolean> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('user_roles')
        .upsert({
            user_id: userId,
            role: newRole,
            updated_at: new Date().toISOString(),
        })

    return !error
}

// Get all users with roles (admin only)
export async function getAllUsersWithRoles(): Promise<UserWithRole[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('user_roles')
        .select(`
      user_id,
      role,
      users:user_id (
        email,
        raw_user_meta_data
      )
    `)

    if (error || !data) {
        return []
    }

    return data.map((item: any) => ({
        id: item.user_id,
        email: item.users?.email || '',
        name: item.users?.raw_user_meta_data?.name || item.users?.raw_user_meta_data?.full_name || '',
        role: item.role,
    }))
}
