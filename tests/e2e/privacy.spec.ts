import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  if (process.env.E2E_USE_PRODUCTION !== "true") return;
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("admin@tupiniquim.local");
  await page.getByLabel("Senha").fill(process.env.SEED_ADMIN_PASSWORD ?? "Tupiniquim!2026");
  await page.getByRole("button", { name: "Entrar no CRM" }).click();
  await page.waitForURL("**/dashboard");
});

test("acesso LGPD exige identidade antes do preview", async ({ page }) => {
  const email = `privacy-e2e-${Date.now()}@synthetic.local`;
  await page.goto("/configuracoes/privacidade");
  await page.locator("summary").filter({ hasText: "Registrar solicitação" }).click();
  await page.getByLabel("Direito exercido *").selectOption("CONFIRMATION_ACCESS");
  await page.getByLabel("E-mail do titular *").fill(email);
  await page.getByRole("button", { name: "Gerar protocolo" }).click();

  let request = page.locator("article").filter({ hasText: email });
  await expect(request).toBeVisible();
  await request.getByLabel("Novo status").selectOption("IDENTITY_VERIFICATION");
  await request.getByRole("button", { name: "Atualizar" }).click();

  request = page.locator("article").filter({ hasText: email });
  await request.getByLabel("Novo status").selectOption("IN_PROGRESS");
  await request.getByRole("button", { name: "Atualizar" }).click();

  request = page.locator("article").filter({ hasText: email });
  await expect(request.getByRole("button", { name: "Gerar preview" })).toBeVisible();
  await request.getByRole("button", { name: "Gerar preview" }).click();
  const previewReady = request.getByText("Preview válido até", { exact: false });
  const previewError = request.getByRole("alert");
  await expect(previewReady.or(previewError)).toBeVisible({ timeout: 20_000 });
  if (await previewError.isVisible()) throw new Error(`Falha do preview na UI: ${await previewError.textContent()}`);
  await expect(previewReady).toBeVisible();
});
