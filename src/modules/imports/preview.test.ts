import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { previewLeadWorkbook } from "./preview";

describe("preview de importação XLSX", () => {
  it("separa linhas válidas e pendências", () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
      { empresa: "Empresa Válida", origem: "Evento", fonte_validacao: "Receita Federal" },
      { empresa: "", origem: "Evento", fonte_validacao: "" },
    ]), "Leads");
    const bytes = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const preview = previewLeadWorkbook(bytes);
    expect(preview.selectedSheet).toBe("Leads");
    expect(preview.rows.map((row) => row.valid)).toEqual([true, false]);
  });
});
