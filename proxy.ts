import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "vt_admin_session";

export function proxy(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE);
  if (!session?.value) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/admin/dashboard/:path*",
};
