import { Redis } from '@upstash/redis'

// Initialize Redis client only if credentials are provided
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null

// Log Redis status on init
console.log('[Redis] Status:', redis ? 'CONNECTED' : 'DISABLED (no credentials)')

// Cache TTL values (in seconds)
const CACHE_TTL = {
    USER_ROLE: 60 * 5, // 5 minutes
    APPLICATIONS_LIST: 60 * 2, // 2 minutes
    APPLICATION_DETAIL: 60 * 3, // 3 minutes
}

// Cache key prefixes
const CACHE_KEYS = {
    userRole: (userId: string) => `user_role:${userId}`,
    applicationsList: (userId: string, role: string) => `apps_list:${role}:${userId}`,
    applicationDetail: (appId: string) => `app:${appId}`,
    reviewerApplications: (status: string) => `reviewer_apps:${status}`,
}

/**
 * Get data from cache with graceful fallback
 * Returns null if cache miss or Redis unavailable
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
    if (!redis) {
        console.log('[Redis] GET skipped - no client')
        return null
    }

    try {
        const cached = await redis.get<T>(key)
        console.log(`[Redis] GET ${key}:`, cached ? 'HIT' : 'MISS')
        return cached
    } catch (error) {
        console.warn('[Redis] GET failed:', key, error)
        return null
    }
}

/**
 * Set data in cache with graceful fallback
 * Silently fails if Redis unavailable
 */
export async function setInCache<T>(
    key: string,
    data: T,
    ttlSeconds: number = CACHE_TTL.APPLICATIONS_LIST
): Promise<void> {
    if (!redis) {
        console.log('[Redis] SET skipped - no client')
        return
    }

    try {
        await redis.set(key, data, { ex: ttlSeconds })
        console.log(`[Redis] SET ${key}: OK (TTL: ${ttlSeconds}s)`)
    } catch (error) {
        console.warn('[Redis] SET failed:', key, error)
    }
}

/**
 * Delete data from cache
 * Silently fails if Redis unavailable
 */
export async function deleteFromCache(key: string): Promise<void> {
    if (!redis) return

    try {
        await redis.del(key)
    } catch (error) {
        console.warn('Redis cache delete failed:', error)
    }
}

/**
 * Delete multiple keys matching a pattern
 * Used to invalidate related caches
 */
export async function invalidatePattern(pattern: string): Promise<void> {
    if (!redis) return

    try {
        // For Upstash, we can't use SCAN easily, so we delete known keys
        // This is a simplified approach
        await redis.del(pattern)
    } catch (error) {
        console.warn('Redis cache invalidate failed:', error)
    }
}

/**
 * Cache user role with fallback
 */
export async function getCachedUserRole(userId: string): Promise<string | null> {
    return getFromCache<string>(CACHE_KEYS.userRole(userId))
}

export async function setCachedUserRole(userId: string, role: string): Promise<void> {
    await setInCache(CACHE_KEYS.userRole(userId), role, CACHE_TTL.USER_ROLE)
}

/**
 * Invalidate user-related caches when role changes
 */
export async function invalidateUserCaches(userId: string): Promise<void> {
    await deleteFromCache(CACHE_KEYS.userRole(userId))
}

/**
 * Invalidate application caches when status changes
 */
export async function invalidateApplicationCaches(appId: string, userId?: string): Promise<void> {
    await deleteFromCache(CACHE_KEYS.applicationDetail(appId))
    // Invalidate list caches - in production, you'd want more sophisticated cache invalidation
    if (userId) {
        await deleteFromCache(CACHE_KEYS.applicationsList(userId, 'user'))
    }
}

export { CACHE_TTL, CACHE_KEYS }
