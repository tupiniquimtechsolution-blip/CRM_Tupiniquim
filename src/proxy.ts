import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const proxy = auth((request) => {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const production = process.env.NODE_ENV === "production";
  const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${production ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self' data:",
    `connect-src 'self'${production ? "" : " ws: http:"}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(production ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
  const requestId = request.headers.get("x-request-id")?.slice(0, 100) || crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", contentSecurityPolicy);
  requestHeaders.set("x-request-id", requestId);
  const pathname = request.nextUrl.pathname;
  const publicRoute = ["/api/auth/", "/api/ops/", "/api/webhooks/", "/api/capture/", "/captura/", "/login", "/recuperar-acesso", "/proposta/", "/privacidade"].some((prefix) => pathname === prefix || pathname.startsWith(prefix));
  const localDemo = process.env.NODE_ENV !== "production" && process.env.DEMO_MODE === "true";
  if (!localDemo && !publicRoute && !request.auth) return NextResponse.redirect(new URL("/login", request.url));
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  response.headers.set("X-Request-Id", requestId);
  return response;
});

export const config = {
  matcher: [{ source: "/((?!api/health|api/ready|_next/static|_next/image|favicon.ico).*)", missing: [{ type: "header", key: "next-router-prefetch" }, { type: "header", key: "purpose", value: "prefetch" }] }],
};
