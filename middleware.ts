import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const userCookie = request.cookies.get("user");
  const userHeader = request.headers.get("x-user");

  const hasUser = userCookie?.value || userHeader;

  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isApiProtected = request.nextUrl.pathname.startsWith("/api/tasks") || 
                         request.nextUrl.pathname.startsWith("/api/groups") ||
                         request.nextUrl.pathname.startsWith("/api/reflection");

  if (isDashboard && !hasUser) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isApiProtected && !hasUser) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/tasks", "/api/groups", "/api/reflection"],
};