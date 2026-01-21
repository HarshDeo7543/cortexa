import { NextResponse } from 'next/server'

// This route is kept for backward compatibility but simplified for Firebase
// Firebase handles OAuth redirects internally with signInWithPopup
// This can be used as a landing page after OAuth if needed

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const next = searchParams.get('next') ?? '/dashboard'

    // For Firebase, OAuth is handled client-side with popup
    // This route just redirects to the desired destination
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'

    if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
    } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
    } else {
        return NextResponse.redirect(`${origin}${next}`)
    }
}
