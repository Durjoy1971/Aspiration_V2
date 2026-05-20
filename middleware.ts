import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('session-token')?.value;
  const { pathname } = request.nextUrl;

  // Gate the student dashboard path
  const isDashboardPath = pathname.startsWith('/dashboard');

  if (isDashboardPath && !sessionToken) {
    // Redirect unauthenticated user to landing page
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run on dashboard paths and exclude statics
  matcher: ['/dashboard/:path*'],
};
