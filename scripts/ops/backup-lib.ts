import { createHash } from "node:crypto";
import { gunzip, gzip } from "node:zlib";
import { promisify } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import { Client, types } from "pg";

// Prisma usa TIMESTAMP WITHOUT TIME ZONE. Preservar o texto do PostgreSQL evita
// deslocamento implícito pelo fuso do host durante backup e restauração.
types.setTypeParser(1114, (value) => value);

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export type BackupColumn = { name: string; dataType: string; udtName: string };
export type BackupTable = { name: string; columns: BackupColumn[]; rows: Record<string, unknown>[]; checksum: string };
export type LogicalBackup = {
  format: "crm-tupiniquim-logical-v1";
  createdAt: string;
  sourceSchema: string;
  migrations: string[];
  dependencyOrder: string[];
  tables: BackupTable[];
};

export function schemaFromDatabaseUrl(databaseUrl: string) {
  const schema = new URL(databaseUrl).searchParams.get("schema") || "public";
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) throw new Error("Schema PostgreSQL inválido.");
  return schema;
}

export function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function normalizeValue(value: unknown, column: BackupColumn) {
  if (Buffer.isBuffer(value)) return { $binary: value.toString("base64") };
  if (column.dataType === "json" || column.dataType === "jsonb") return value;
  return value;
}

export function normalizeRows(rows: Record<string, unknown>[], columns: BackupColumn[]) {
  return rows.map((row) => Object.fromEntries(columns.map((column) => [column.name, normalizeValue(row[column.name], column)])))
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}

export function checksumRows(rows: Record<string, unknown>[]) {
  return createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}

export async function inspectDatabase(client: Client, schema: string) {
  const tablesResult = await client.query<{ table_name: string }>(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = $1 AND table_type = 'BASE TABLE' AND table_name <> '_prisma_migrations'
    ORDER BY table_name
  `, [schema]);
  const names = tablesResult.rows.map((row) => row.table_name);
  const dependenciesResult = await client.query<{ table_name: string; foreign_table_name: string }>(`
    SELECT tc.table_name, ccu.table_name AS foreign_table_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name AND ccu.constraint_schema = tc.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = $1
  `, [schema]);
  const dependencies = new Map(names.map((name) => [name, new Set<string>()]));
  for (const dependency of dependenciesResult.rows) {
    if (dependency.table_name !== dependency.foreign_table_name && dependencies.has(dependency.table_name) && dependencies.has(dependency.foreign_table_name)) {
      dependencies.get(dependency.table_name)?.add(dependency.foreign_table_name);
    }
  }
  const order: string[] = [];
  const pending = new Set(names);
  while (pending.size) {
    const ready = [...pending].filter((name) => [...(dependencies.get(name) ?? [])].every((dependency) => !pending.has(dependency))).sort();
    if (!ready.length) throw new Error(`Dependência circular detectada entre tabelas: ${[...pending].join(", ")}`);
    for (const name of ready) { order.push(name); pending.delete(name); }
  }
  return order;
}

export async function createLogicalBackup(databaseUrl: string): Promise<LogicalBackup> {
  const schema = schemaFromDatabaseUrl(databaseUrl);
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const dependencyOrder = await inspectDatabase(client, schema);
    const migrations = (await client.query<{ migration_name: string }>(`SELECT migration_name FROM ${quoteIdentifier(schema)}."_prisma_migrations" WHERE finished_at IS NOT NULL ORDER BY started_at`)).rows.map((row) => row.migration_name);
    const tables: BackupTable[] = [];
    for (const name of dependencyOrder) {
      const columns = (await client.query<{ column_name: string; data_type: string; udt_name: string }>(`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position
      `, [schema, name])).rows.map((column) => ({ name: column.column_name, dataType: column.data_type, udtName: column.udt_name }));
      const selected = columns.map((column) => quoteIdentifier(column.name)).join(", ");
      const rawRows = (await client.query<Record<string, unknown>>(`SELECT ${selected} FROM ${quoteIdentifier(schema)}.${quoteIdentifier(name)}`)).rows;
      const rows = normalizeRows(rawRows, columns);
      tables.push({ name, columns, rows, checksum: checksumRows(rows) });
    }
    await client.query("COMMIT");
    return { format: "crm-tupiniquim-logical-v1", createdAt: new Date().toISOString(), sourceSchema: schema, migrations, dependencyOrder, tables };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

export async function writeBackup(filePath: string, backup: LogicalBackup) {
  await writeFile(filePath, await gzipAsync(Buffer.from(JSON.stringify(backup), "utf8")), { flag: "wx" });
}

export async function readBackup(filePath: string) {
  const parsed = JSON.parse((await gunzipAsync(await readFile(filePath))).toString("utf8")) as LogicalBackup;
  if (parsed.format !== "crm-tupiniquim-logical-v1" || !Array.isArray(parsed.tables)) throw new Error("Formato de backup não reconhecido.");
  return parsed;
}

export function decodeBackupValue(value: unknown) {
  if (value && typeof value === "object" && "$binary" in value && typeof (value as { $binary?: unknown }).$binary === "string") return Buffer.from((value as { $binary: string }).$binary, "base64");
  return value;
}
