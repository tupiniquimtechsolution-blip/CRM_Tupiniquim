import { spawnSync } from "node:child_process";
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import { Client } from "pg";
import { checksumRows, decodeBackupValue, normalizeRows, quoteIdentifier, readBackup } from "./backup-lib";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL não configurada.");
const backupDir = path.resolve(process.env.BACKUP_DIR || path.join(process.cwd(), ".backups"));
const requested = process.argv[2];
const candidates = (await readdir(backupDir)).filter((name) => /^crm-.*\.json\.gz$/.test(name)).sort().reverse();
const backupPath = requested ? path.resolve(requested) : candidates[0] ? path.join(backupDir, candidates[0]) : "";
if (!backupPath || !backupPath.startsWith(backupDir + path.sep)) throw new Error("Backup válido não encontrado dentro de .backups.");
const backup = await readBackup(backupPath);
const drillSchema = `crm_restore_${Date.now()}`;
if (!/^crm_restore_\d+$/.test(drillSchema)) throw new Error("Nome de schema de teste inválido.");
const targetUrl = new URL(databaseUrl);
targetUrl.searchParams.set("schema", drillSchema);
const admin = new Client({ connectionString: databaseUrl });
await admin.connect();
const startedAt = Date.now();
try {
  await admin.query(`CREATE SCHEMA ${quoteIdentifier(drillSchema)}`);
  const migration = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: targetUrl.toString() },
    encoding: "utf8",
    timeout: 300_000,
  });
  if (migration.status !== 0) throw new Error(`Migrações falharam no schema de restauração (status ${migration.status}, sinal ${migration.signal ?? "nenhum"}): ${migration.error?.message || migration.stderr || migration.stdout || "sem saída"}`);
  const target = new Client({ connectionString: targetUrl.toString() });
  await target.connect();
  try {
    const appliedMigrations = (await target.query<{ migration_name: string }>(`SELECT migration_name FROM ${quoteIdentifier(drillSchema)}."_prisma_migrations" WHERE finished_at IS NOT NULL ORDER BY started_at`)).rows.map((row) => row.migration_name);
    if (JSON.stringify(appliedMigrations) !== JSON.stringify(backup.migrations)) throw new Error("O conjunto de migrações do backup difere do código validado.");
    await target.query("BEGIN");
    for (const tableName of backup.dependencyOrder) {
      const table = backup.tables.find((item) => item.name === tableName);
      if (!table?.rows.length) continue;
      const columns = table.columns.map((column) => quoteIdentifier(column.name));
      const placeholders = table.columns.map((_, index) => `$${index + 1}`);
      const statement = `INSERT INTO ${quoteIdentifier(drillSchema)}.${quoteIdentifier(table.name)} (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`;
      for (const row of table.rows) {
        const values = table.columns.map((column) => {
          const value = decodeBackupValue(row[column.name]);
          return (column.dataType === "json" || column.dataType === "jsonb") && value !== null ? JSON.stringify(value) : value;
        });
        await target.query(statement, values);
      }
    }
    await target.query("COMMIT");
    for (const table of backup.tables) {
      const selected = table.columns.map((column) => quoteIdentifier(column.name)).join(", ");
      const rows = (await target.query<Record<string, unknown>>(`SELECT ${selected} FROM ${quoteIdentifier(drillSchema)}.${quoteIdentifier(table.name)}`)).rows;
      const normalized = normalizeRows(rows, table.columns);
      const checksum = checksumRows(normalized);
      if (checksum !== table.checksum) throw new Error(`Checksum divergente após restauração da tabela ${table.name}. Esperado ${table.checksum}, obtido ${checksum}. Primeira linha esperada: ${JSON.stringify(table.rows[0])}. Primeira linha obtida: ${JSON.stringify(normalized[0])}.`);
    }
  } catch (error) {
    await target.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await target.end();
  }
  const result = { status: "restored_and_verified", backup: backupPath, schema: drillSchema, tables: backup.tables.length, rows: backup.tables.reduce((total, table) => total + table.rows.length, 0), migrations: backup.migrations.length, durationMs: Date.now() - startedAt, verifiedAt: new Date().toISOString() };
  await writeFile(path.join(backupDir, "last-restore-drill.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally {
  await admin.query(`DROP SCHEMA IF EXISTS ${quoteIdentifier(drillSchema)} CASCADE`);
  await admin.end();
}
