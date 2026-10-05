import { NextResponse, type NextRequest } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:5000";

// true = yaroqli, false = yaroqsiz, null = bilib bo'lmadi (backend o'chiq / 5xx)
async function checkSession(cookieHeader: string): Promise<boolean | null> {
  try {
    const res = await fetch(`${BACKEND}/api/auth/me`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) return true;
    if (res.status === 401 || res.status === 403) return false;
    return null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === "/login";
  const hasCookie = !!request.cookies.get("session")?.value;
  const toLogin = () => NextResponse.redirect(new URL("/login", request.url));

  // 1. Cookie umuman yo'q
  if (!hasCookie) return isLoginPage ? NextResponse.next() : toLogin();

  // 2. Cookie bor: backend'dan so'raymiz
  const valid = await checkSession(request.headers.get("cookie") ?? "");

  // 3. Yaroqsiz: cookie'ni o'chirib, loginga yuboramiz (tsiklni shu uzadi)
  if (valid === false) {
    const res = isLoginPage ? NextResponse.next() : toLogin();
    res.cookies.delete("session");
    return res;
  }

  // 4. Yaroqli va /login ga kirmoqchi: dashboard'ga
  if (valid === true && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 5. Yaroqli, yoki backend javob bermadi: o'tkazamiz
  return NextResponse.next();
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|flags|data).*)",
      // prefetch so'rovlarda backend'ni ortiqcha yuklamaslik uchun
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
