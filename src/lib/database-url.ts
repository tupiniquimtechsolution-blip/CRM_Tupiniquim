export function resolveDatabaseUrl(environment: NodeJS.ProcessEnv = process.env) {
  const configured = environment.DATABASE_URL?.trim();
  if (!configured) throw new Error("DATABASE_URL é obrigatória.");
  return configured;
}
