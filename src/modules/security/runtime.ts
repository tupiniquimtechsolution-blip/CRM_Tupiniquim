type RuntimeCheck = { name: string; ok: boolean; message: string };

function present(name: string) {
  return Boolean(process.env[name]?.trim());
}

export function validateRuntimeConfiguration(environment = process.env.NODE_ENV) {
  const production = environment === "production";
  const appUrl = process.env.APP_URL?.trim() ?? "";
  const checks: RuntimeCheck[] = [
    { name: "database", ok: present("DATABASE_URL"), message: "DATABASE_URL configurada" },
    { name: "auth-secret", ok: !production || (process.env.AUTH_SECRET?.trim().length ?? 0) >= 32, message: "AUTH_SECRET com pelo menos 32 caracteres em produção" },
    { name: "demo-mode", ok: !production || process.env.DEMO_MODE !== "true", message: "DEMO_MODE desativado em produção" },
    { name: "app-url", ok: !production || appUrl.startsWith("https://"), message: "APP_URL usa HTTPS em produção" },
    { name: "privacy-contact", ok: !production || present("PRIVACY_CONTACT_EMAIL"), message: "canal de privacidade configurado" },
    { name: "openai-key", ok: process.env.AI_PROVIDER !== "openai" || present("OPENAI_API_KEY"), message: "credencial do provedor de IA configurada" },
  ];
  return { ok: checks.every((check) => check.ok), checks };
}
