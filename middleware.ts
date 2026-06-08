import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    const guard = (allowed: string, home: string) => {
      if (role !== allowed) {
        return NextResponse.redirect(new URL(home, req.url));
      }
      return null;
    };

    if (pathname.startsWith("/admin")) {
      const r = guard("ADMIN", "/login");
      if (r) return r;
    }
    if (pathname.startsWith("/doctor")) {
      const r = guard("DOCTOR", "/login");
      if (r) return r;
    }
    if (pathname.startsWith("/patient")) {
      const r = guard("PATIENT", "/login");
      if (r) return r;
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  },
);

export const config = {
  matcher: ["/admin/:path*", "/doctor/:path*", "/patient/:path*"],
};
