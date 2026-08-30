import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  if (process.env.E2E_USE_PRODUCTION !== "true") return;
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("admin@tupiniquim.local");
  await page.getByLabel("Senha").fill(process.env.SEED_ADMIN_PASSWORD ?? "Tupiniquim!2026");
  await page.getByRole("button", { name: "Entrar no CRM" }).click();
  await page.waitForURL("**/dashboard");
});

test("dashboard responsivo apresenta indicadores e navegação", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /bom dia/i })).toBeVisible();
  await expect(page.getByText("Pipeline aberto")).toBeVisible();
});

test("funil oferece movimentação acessível", async ({ page }) => {
  await page.goto("/funil");
  await expect(page.getByRole("heading", { name: "Pipeline principal" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Avançar" }).first()).toBeVisible();
});

test("cadastro de lead exige empresa", async ({ page }) => {
  await page.goto("/leads");
  await page.locator("summary", { hasText: "Novo lead" }).click();
  await expect(page.getByLabel("Empresa *")).toBeVisible();
});

test("visão 360 de clientes cobre onboarding, tickets e retenção", async ({ page }) => {
  await page.goto("/clientes");
  await expect(page.getByRole("heading", { name: "Clientes e retenção" })).toBeVisible();
  await expect(page.getByText("Saúde média")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Onboarding" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Tickets e atendimento" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Renovações e churn" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Expansão e upsell" }).first()).toBeVisible();
});
