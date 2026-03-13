import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const mvpEmail = request.cookies.get("mvp_email")?.value;

  // Protect dashboard routes — redirect to login if no MVP email cookie
  if (!mvpEmail && request.nextUrl.pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from login
  if (mvpEmail && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
