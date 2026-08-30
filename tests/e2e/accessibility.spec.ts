import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  if (process.env.E2E_USE_PRODUCTION !== "true") return;
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("admin@tupiniquim.local");
  await page.getByLabel("Senha").fill(process.env.SEED_ADMIN_PASSWORD ?? "Tupiniquim!2026");
  await page.getByRole("button", { name: "Entrar no CRM" }).click();
  await page.waitForURL("**/dashboard");
});

const routes = [
  { path: "/dashboard", name: "painel autenticado" },
  { path: "/configuracoes/privacidade", name: "governança de privacidade" },
  { path: "/privacidade", name: "aviso público de privacidade" },
];

for (const route of routes) {
  test(`${route.name} não tem violações WCAG graves ou críticas`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page.locator("main")).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    const blocking = results.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""));
    expect(blocking, blocking.map((violation) => `${violation.id}: ${violation.help}`).join("\n")).toEqual([]);
  });
}

test("fluxo público expõe foco visível e aviso de privacidade", async ({ page }) => {
  await page.goto("/privacidade");
  const access = page.getByRole("link", { name: "Acessar o CRM" });
  await access.focus();
  await expect(access).toBeFocused();
  await expect(page.getByRole("heading", { name: "Seus direitos" })).toBeVisible();
});
