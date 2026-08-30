"use server";

import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/current-actor";
import { createReportExport } from "@/modules/reports/service";

export async function exportReportAction(formData: FormData) {
  const reportType = String(formData.get("reportType") ?? "EXECUTIVO");
  const row = await createReportExport(await getCurrentActor(), reportType);
  redirect(`/api/exports/${row.id}`);
}
