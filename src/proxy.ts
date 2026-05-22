import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DEVICE_LOCK_COOKIE = "rm_device_lock";

export function proxy(request: NextRequest) {
  const hasLock = request.cookies.has(DEVICE_LOCK_COOKIE);

  if (hasLock) {
    // If the device is locked, redirect immediately to the root page.
    const { pathname } = request.nextUrl;
    if (pathname !== "/") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

// Match all event selection routes
export const config = {
  matcher: "/event/:path*",
};
