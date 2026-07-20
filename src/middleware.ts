import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "bttrme_session";

// Fast path only: no cookie -> straight to /login, remembering where the
// user was headed (PRD 01 §9). Real validation happens in the (app) layout,
// where the Node runtime and the database live.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  if (!request.cookies.get(SESSION_COOKIE)?.value) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Everything except static assets and Next internals (FR-1).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
