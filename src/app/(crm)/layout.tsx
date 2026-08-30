import { AppShell } from "@/components/app-shell";
import { getCurrentActor } from "@/lib/current-actor";

export const dynamic = "force-dynamic";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const actor = await getCurrentActor();
  return <AppShell actor={actor}>{children}</AppShell>;
}
