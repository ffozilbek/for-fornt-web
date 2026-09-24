// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Brauzerdan kelgan session cookie'sini tekshiramiz
  const sessionCookie = request.cookies.get("session")?.value;

  const isLoginPage = pathname === "/login";

  // 1. Agar foydalanuvchi tizimga kirmagan bo'lsa va login bo'lmagan sahifani ochsa
  if (!sessionCookie && !isLoginPage) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Agar foydalanuvchi allaqachon login qilgan bo'lsa va /login sahifasiga kirmoqchi bo'lsa (Guest Guard)
  if (sessionCookie && isLoginPage) {
    const dashboardUrl = new URL("/", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

// Qaysi manzillarda middleware ishlashi kerakligini belgilaymiz
export const config = {
  matcher: [
    /*
     * Quyidagilardan TASHQARI barcha yo'llarda ishlaydi:
     * - api yo'llari (/api/...)
     * - statik fayllar (_next/static, _next/image, favicon.ico, flags, data va h.k.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|flags|data).*)",
  ],
};
