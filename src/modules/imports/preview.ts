import * as XLSX from "xlsx";
import { importLeadRowSchema } from "@/modules/leads/schema";

export type ImportPreviewRow = {
  row: number;
  valid: boolean;
  data: unknown;
  errors: string[];
};

export function previewLeadWorkbook(buffer: ArrayBuffer): { sheets: string[]; selectedSheet: string; rows: ImportPreviewRow[] } {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const selectedSheet = workbook.SheetNames[0];
  if (!selectedSheet) throw new Error("A planilha não possui abas legíveis.");
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[selectedSheet], { defval: "" });
  const rows = rawRows.map((row, index) => {
    const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), String(value).trim()]));
    const result = importLeadRowSchema.safeParse(normalized);
    return result.success
      ? { row: index + 2, valid: true, data: result.data, errors: [] }
      : { row: index + 2, valid: false, data: normalized, errors: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) };
  });
  return { sheets: workbook.SheetNames, selectedSheet, rows };
}
