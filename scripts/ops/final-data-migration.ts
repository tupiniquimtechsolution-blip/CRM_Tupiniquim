import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import Papa from "papaparse";

const inputArg = process.argv.find((argument) => argument.startsWith("--input="))?.slice(8);
const execute = process.argv.includes("--execute");
if (!inputArg) throw new Error("Informe --input=<arquivo.csv>. O padrão é dry-run; --execute exige processo aprovado.");
const inputPath = path.resolve(inputArg);
const projectRoot = path.resolve(process.cwd());
if (!inputPath.startsWith(projectRoot + path.sep)) throw new Error("O arquivo de migração deve estar dentro do workspace canônico em F:.");
const bytes = await readFile(inputPath);
const parsed = Papa.parse<Record<string, string>>(bytes.toString("utf8"), { header: true, skipEmptyLines: true });
const required = ["companyName", "contactName", "email", "source"];
const headers = parsed.meta.fields ?? [];
const missing = required.filter((field) => !headers.includes(field));
const errors = [...parsed.errors.map((error) => ({ row: error.row, message: error.message }))];
for (const [index, row] of parsed.data.entries()) {
  if (!row.companyName?.trim()) errors.push({ row: index + 2, message: "companyName obrigatório" });
  if (!row.contactName?.trim()) errors.push({ row: index + 2, message: "contactName obrigatório" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email?.trim() || "")) errors.push({ row: index + 2, message: "email inválido" });
}
if (execute) throw new Error("A execução final permanece bloqueada até haver origem aprovada, mapeamento assinado, backup restaurável e janela de mudança. Use o fluxo de importação auditado do CRM após o dry-run.");
const manifest = { mode: "dry-run", input: path.relative(projectRoot, inputPath), sha256: createHash("sha256").update(bytes).digest("hex"), rows: parsed.data.length, headers, missingHeaders: missing, errors: errors.slice(0, 100), valid: missing.length === 0 && errors.length === 0, createdAt: new Date().toISOString() };
await mkdir(path.resolve("artifacts", "migration"), { recursive: true });
await writeFile(path.resolve("artifacts", "migration", "latest-manifest.json"), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest));
if (!manifest.valid) process.exitCode = 1;
