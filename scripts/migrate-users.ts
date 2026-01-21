/**
 * Supabase to Firebase User Migration Script
 * 
 * Run with: npx ts-node scripts/migrate-users.ts
 * 
 * Prerequisites:
 * - Set up Firebase project
 * - Configure .env.local with Firebase Admin credentials
 * - Install ts-node: pnpm add -D ts-node
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

// Initialize Firebase Admin if not already initialized
function initAdmin() {
    if (getApps().length > 0) {
        return getAuth()
    }

    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: privateKey,
        }),
    })

    return getAuth()
}

// Users exported from Supabase
const supabaseUsers = [
    {
        "id": "f3073cc2-3e32-4a53-b429-10719147723d",
        "email": "harshdeo5142@gmail.com",
        "name": "Compilance Demo",
        "role": "compliance_officer"
    },
    {
        "id": "04aa5834-b48f-436e-ba4d-7758012008fc",
        "email": "harsh.arcade.2025@gmail.com",
        "name": "Harsh Deo",
        "role": null
    },
    {
        "id": "fa00c1a1-c472-40a2-ae14-3b8c8ff3fc98",
        "email": "harsh.deo.arcade@gmail.com",
        "name": "Harsh Deo",
        "role": null
    },
    {
        "id": "419e3a34-c0f9-4343-9af2-1066f38fe48b",
        "email": "krishna@gmail.com",
        "name": "Harsh Deo",
        "role": null
    },
    {
        "id": "b728ca12-3183-47d5-9783-1b985770a5c3",
        "email": "hdevjharkhand@gmail.com",
        "name": "Reviewer Demo",
        "role": "junior_reviewer"
    },
    {
        "id": "804436ce-3b54-4e0d-a283-e059416e6754",
        "email": "harshdeo7543@gmail.com",
        "name": "Harsh Deo",
        "role": "admin"
    },
    {
        "id": "be8eb28e-342d-4fb0-baa5-046e747a6081",
        "email": "sauravsinghon2002@gmail.com",
        "name": "Saurav Singh",
        "role": "user"
    },
    {
        "id": "9083cc33-f87b-4cb2-bd1e-4f21ba50e6cc",
        "email": "jackreaper1927@gmail.com",
        "name": "Reaper",
        "role": "user"
    },
    {
        "id": "8ef5b440-586d-41d5-b1f4-a703d33a8b1e",
        "email": "marutikar1234@gmail.com",
        "name": "Maruti Kar",
        "role": "user"
    }
]

interface MigrationResult {
    email: string
    status: 'created' | 'exists' | 'error'
    firebaseUid?: string
    message?: string
}

async function migrateUsers(): Promise<void> {
    console.log('🚀 Starting user migration from Supabase to Firebase...\n')

    // Load environment variables
    require('dotenv').config({ path: '.env.local' })

    const auth = initAdmin()
    const results: MigrationResult[] = []

    for (const user of supabaseUsers) {
        console.log(`Processing: ${user.email}`)

        try {
            // Check if user already exists
            let firebaseUser
            try {
                firebaseUser = await auth.getUserByEmail(user.email)
                console.log(`  ⚠️  User already exists: ${firebaseUser.uid}`)

                // Update custom claims with role
                const role = user.role || 'user'
                await auth.setCustomUserClaims(firebaseUser.uid, { role })
                console.log(`  ✅ Updated role to: ${role}`)

                results.push({
                    email: user.email,
                    status: 'exists',
                    firebaseUid: firebaseUser.uid,
                    message: `Existing user, role updated to ${role}`
                })
            } catch (error: any) {
                if (error.code === 'auth/user-not-found') {
                    // Create new user
                    firebaseUser = await auth.createUser({
                        email: user.email,
                        displayName: user.name,
                        emailVerified: true, // Trust Supabase's verification
                    })
                    console.log(`  ✅ Created user: ${firebaseUser.uid}`)

                    // Set custom claims with role
                    const role = user.role || 'user'
                    await auth.setCustomUserClaims(firebaseUser.uid, { role })
                    console.log(`  ✅ Set role to: ${role}`)

                    results.push({
                        email: user.email,
                        status: 'created',
                        firebaseUid: firebaseUser.uid,
                        message: `Created with role: ${role}`
                    })
                } else {
                    throw error
                }
            }
        } catch (error: any) {
            console.log(`  ❌ Error: ${error.message}`)
            results.push({
                email: user.email,
                status: 'error',
                message: error.message
            })
        }

        console.log('')
    }

    // Print summary
    console.log('\n📊 Migration Summary')
    console.log('='.repeat(60))

    const created = results.filter(r => r.status === 'created')
    const existing = results.filter(r => r.status === 'exists')
    const errors = results.filter(r => r.status === 'error')

    console.log(`✅ Created: ${created.length}`)
    console.log(`⚠️  Already existed: ${existing.length}`)
    console.log(`❌ Errors: ${errors.length}`)

    if (errors.length > 0) {
        console.log('\nErrors:')
        errors.forEach(e => console.log(`  - ${e.email}: ${e.message}`))
    }

    console.log('\n📧 Password Reset Required:')
    console.log('Since passwords cannot be exported from Supabase,')
    console.log('users will need to use "Forgot Password" or Google Sign-In.')

    // Generate password reset links for each user
    console.log('\n🔗 Generating password reset links...')
    for (const result of results) {
        if (result.status !== 'error' && result.firebaseUid) {
            try {
                const link = await auth.generatePasswordResetLink(result.email)
                console.log(`  ${result.email}: ${link}`)
            } catch (error: any) {
                console.log(`  ${result.email}: Could not generate link - ${error.message}`)
            }
        }
    }

    console.log('\n✅ Migration complete!')
}

// Run the migration
migrateUsers().catch(console.error)
