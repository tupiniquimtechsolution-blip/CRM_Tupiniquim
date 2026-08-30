import type { NextConfig } from "next";

const allowedDevOrigins = ["127.0.0.1", "localhost"];
if (process.env.CRM_LAN_HOST) allowedDevOrigins.push(process.env.CRM_LAN_HOST);

const production = process.env.NODE_ENV === "production";
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  ...(production ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
];

const nextConfig: NextConfig = {
  allowedDevOrigins,
  output: "standalone",
  poweredByHeader: false,
  deploymentId: process.env.DEPLOYMENT_VERSION,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
