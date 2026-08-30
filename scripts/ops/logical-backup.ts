import { mkdir, readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import { createLogicalBackup, writeBackup } from "./backup-lib";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const projectRoot = process.cwd();
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL não configurada.");
const backupDir = path.resolve(process.env.BACKUP_DIR || path.join(projectRoot, ".backups"));
const canonicalRoot = path.resolve(projectRoot);
if (!backupDir.startsWith(canonicalRoot + path.sep)) throw new Error("BACKUP_DIR deve permanecer dentro do projeto canônico em F:.");
await mkdir(backupDir, { recursive: true });

const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
const filePath = path.join(backupDir, `crm-${stamp}.json.gz`);
const backup = await createLogicalBackup(databaseUrl);
await writeBackup(filePath, backup);

const retentionDays = Math.max(1, Number(process.env.BACKUP_RETENTION_DAYS || 14));
const cutoff = Date.now() - retentionDays * 86_400_000;
for (const name of await readdir(backupDir)) {
  if (!/^crm-.*\.json\.gz$/.test(name) || name === path.basename(filePath)) continue;
  const candidate = path.join(backupDir, name);
  if ((await stat(candidate)).mtimeMs < cutoff) await unlink(candidate);
}

console.log(JSON.stringify({ status: "created", file: filePath, tables: backup.tables.length, rows: backup.tables.reduce((total, table) => total + table.rows.length, 0), migrations: backup.migrations.length }));
