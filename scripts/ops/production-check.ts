import { spawnSync } from "node:child_process";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

type Check = { name: string; ok: boolean; detail: string };
const checks: Check[] = [];
const add = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail });
const databaseUrl = process.env.DATABASE_URL || "";
add("DATABASE_URL", Boolean(databaseUrl), "conexão do banco definida");
add("AUTH_SECRET", (process.env.AUTH_SECRET?.trim().length ?? 0) >= 32, "segredo com pelo menos 32 caracteres");
add("DEMO_MODE", process.env.DEMO_MODE !== "true", "modo de demonstração desativado");
add("APP_URL", process.env.APP_URL?.startsWith("https://") ?? false, "URL pública com HTTPS");
add("PRIVACY_CONTACT_EMAIL", Boolean(process.env.PRIVACY_CONTACT_EMAIL?.trim()), "canal do titular definido");
add("NEXT_SERVER_ACTIONS_ENCRYPTION_KEY", Boolean(process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY?.trim()), "chave estável para múltiplas instâncias");
try { await access(path.resolve(".next", "standalone", "server.js")); add("build", true, "artefato standalone presente"); } catch { add("build", false, "execute pnpm build"); }
try {
  const backupDir = path.resolve(process.env.BACKUP_DIR || ".backups");
  const backups = (await readdir(backupDir)).filter((name) => name.endsWith(".json.gz"));
  add("backup", backups.length > 0, `${backups.length} backup(s) local(is)`);
  const drill = JSON.parse(await readFile(path.join(backupDir, "last-restore-drill.json"), "utf8")) as { status?: string; verifiedAt?: string };
  add("restore-drill", drill.status === "restored_and_verified", `último ensaio: ${drill.verifiedAt ?? "sem data"}`);
} catch { add("backup", false, "nenhum backup validado"); }
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const auditRun = spawnSync(pnpmCommand, ["audit", "--prod", "--json"], { cwd: process.cwd(), env: process.env, encoding: "utf8", timeout: 120_000, shell: process.platform === "win32" });
try {
  const audit = JSON.parse(auditRun.stdout) as { metadata?: { vulnerabilities?: { high?: number; critical?: number } } };
  add("dependency-audit", (audit.metadata?.vulnerabilities?.high ?? 0) === 0 && (audit.metadata?.vulnerabilities?.critical ?? 0) === 0, "sem vulnerabilidade alta/crítica");
} catch { add("dependency-audit", false, "auditoria de dependências sem resultado válido"); }
if (databaseUrl) {
  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    const pending = await client.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM \"_prisma_migrations\" WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL");
    add("migrations", pending.rows[0]?.count === "0", "histórico de migrações íntegro");
  } catch { add("migrations", false, "banco indisponível"); } finally { await client.end().catch(() => undefined); }
}
const pass = checks.every((check) => check.ok);
console.log(JSON.stringify({ pass, checks }, null, 2));
if (!pass) process.exitCode = 1;
