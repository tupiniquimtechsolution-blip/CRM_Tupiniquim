import { expect, test } from "@playwright/test";

test("health, readiness e cabeçalhos de segurança estão ativos", async ({ request }) => {
  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  expect(health.headers()["cache-control"]).toContain("no-store");
  expect(health.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(health.headers()["x-content-type-options"]).toBe("nosniff");
  expect(health.headers()["x-frame-options"]).toBe("DENY");
  expect(health.headers()["x-request-id"]).toBeTruthy();
  if (process.env.E2E_USE_PRODUCTION === "true") expect(health.headers()["strict-transport-security"]).toContain("max-age=");
  const ready = await request.get("/api/ready");
  expect(ready.status()).toBe(200);
  expect(await ready.json()).toMatchObject({ status: "ready", checks: { configuration: true, database: true } });
});

test("monitor operacional exige sessão e retorna apenas contadores", async ({ page }) => {
  const unauthorized = await page.request.get("/api/ops/status");
  expect(unauthorized.status()).toBe(401);
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("admin@tupiniquim.local");
  await page.getByLabel("Senha").fill(process.env.SEED_ADMIN_PASSWORD ?? "Tupiniquim!2026");
  await page.getByRole("button", { name: "Entrar no CRM" }).click();
  await page.waitForURL("**/dashboard");
  const authorized = await page.request.get("/api/ops/status");
  expect(authorized.status()).toBe(200);
  const body = await authorized.json();
  expect(body).toMatchObject({ counters: { failedAutomations: expect.any(Number), failedWebhooks: expect.any(Number), pendingApprovals: expect.any(Number), overduePrivacyRequests: expect.any(Number), highIncidents: expect.any(Number) } });
  expect(JSON.stringify(body)).not.toContain("DATABASE_URL");
});

test("smoke de carga mantém erro e p95 dentro do gate", async ({ request }) => {
  for (let warmup = 0; warmup < 10; warmup++) await request.get("/api/health");
  const samples: number[] = [];
  let errors = 0;
  const total = 50;
  const concurrency = 5;
  for (let offset = 0; offset < total; offset += concurrency) {
    await Promise.all(Array.from({ length: Math.min(concurrency, total - offset) }, async () => {
      const started = performance.now();
      const response = await request.get("/api/health");
      samples.push(performance.now() - started);
      if (response.status() !== 200) errors++;
    }));
  }
  samples.sort((a, b) => a - b);
  const p95 = samples[Math.floor(samples.length * 0.95)] ?? Infinity;
  expect(errors / total).toBeLessThanOrEqual(0.01);
  expect(p95).toBeLessThanOrEqual(500);
});
