import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Strip Shopify app prefix kalau ada
  const shopifyPrefix = "/admin/apps/docverify";
  if (pathname.startsWith(shopifyPrefix)) {
    const newPath = pathname.replace(shopifyPrefix, "") || "/admin";
    return NextResponse.rewrite(new URL(newPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/apps/docverify/:path*",
};
