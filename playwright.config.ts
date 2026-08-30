import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

const productionE2E = process.env.E2E_USE_PRODUCTION === "true";
const e2ePort = Number(process.env.E2E_PORT || 3100);
const e2eBaseUrl = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: e2eBaseUrl, trace: "on-first-retry" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: productionE2E ? `pnpm exec next start -H 127.0.0.1 -p ${e2ePort}` : `pnpm exec next dev -H 127.0.0.1 -p ${e2ePort}`,
    url: `${e2eBaseUrl}/api/health`,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      NODE_ENV: productionE2E ? "production" : "development",
      DEMO_MODE: productionE2E ? "false" : "true",
      AUTH_SECRET: process.env.AUTH_SECRET ?? "test-only-auth-secret-32-characters",
      DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://test:test@127.0.0.1:5432/test",
      AI_PROVIDER: "simulated",
      AUTH_RATE_LIMIT_MAX: "100",
      APP_URL: "https://crm.local.test",
      PRIVACY_CONTACT_EMAIL: "privacidade@example.invalid",
      DEPLOYMENT_VERSION: "phase8-e2e",
      NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: "MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI=",
    },
  },
});
