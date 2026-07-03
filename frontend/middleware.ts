// middleware.ts
// Next.js middleware for route protection.
// Redirects unauthenticated users to /login.
// Redirects authenticated users away from /login to /dashboard.

import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login"];
const PROTECTED_ROUTES = ["/dashboard", "/orders"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for auth cookie/storage (we use a simple check here)
  // For production, use a proper server-side session or signed cookie
  const token = request.cookies.get("access_token")?.value;

  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isProtectedRoute = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));

  // If accessing protected route without token → redirect to login
  if (isProtectedRoute && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If authenticated user visits login → redirect to dashboard
  if (isPublicRoute && token) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
