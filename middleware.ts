import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/documents', '/review', '/admin', '/logs']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  // Check for Firebase session cookie
  const sessionCookie = request.cookies.get('__session')?.value

  if (isProtectedPath && !sessionCookie) {
    // Redirect to signin if no session
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // Note: Full token verification is done server-side in API routes and server components
  // The middleware just checks for cookie presence for quick redirect
  // This is because Edge Runtime doesn't fully support firebase-admin

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
