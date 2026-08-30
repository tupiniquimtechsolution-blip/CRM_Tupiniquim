import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  if (process.env.E2E_USE_PRODUCTION !== "true") return;
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("admin@tupiniquim.local");
  await page.getByLabel("Senha").fill(process.env.SEED_ADMIN_PASSWORD ?? "Tupiniquim!2026");
  await page.getByRole("button", { name: "Entrar no CRM" }).click();
  await page.waitForURL("**/dashboard");
});

test("automações exibem fila, integrações e aprovações", async ({ page }) => {
  await page.goto("/automacoes");
  await expect(page.getByRole("heading", { name: "Automações e integrações" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Automações versionadas" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fila e auditoria" })).toBeVisible();
  await expect(page.getByText("Garantia antirrepetição:")).toBeVisible();
});

test("relatórios apresentam conciliação e exportação autorizada", async ({ page }) => {
  await page.goto("/relatorios");
  await expect(page.getByRole("heading", { name: "Relatórios conciliáveis" })).toBeVisible();
  await expect(page.getByText("Conciliação:")).toBeVisible();
  await expect(page.getByRole("button", { name: "Exportar CSV" })).toBeVisible();
});

test("assistente IA informa provedor e revisão humana", async ({ page }) => {
  await page.goto("/assistente");
  await expect(page.getByRole("heading", { name: "Assistente comercial" })).toBeVisible();
  await expect(page.getByText("Provedor ativo")).toBeVisible();
  await expect(page.getByText("nunca é enviada automaticamente", { exact: false })).toBeVisible();
});

test("formulário público de captura é acessível sem sessão", async ({ page }) => {
  await page.goto("/automacoes");
  const captureHref = await page.locator('a[href^="/captura/"]').first().getAttribute("href");
  expect(captureHref).toBeTruthy();
  await page.context().clearCookies();
  await page.goto(captureHref!);
  await expect(page.getByRole("heading", { name: "Fale com a Tupiniquim" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar com segurança" })).toBeVisible();
});
