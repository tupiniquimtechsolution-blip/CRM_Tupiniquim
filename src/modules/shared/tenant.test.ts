import { describe, expect, it } from "vitest";
import { assertPermission, assertTenant, can, tenantWhere, type TenantActor } from "./tenant";

const sales: TenantActor = { userId: "u1", organizationId: "org-a", organizationName: "A", role: "SALES" };

describe("isolamento e autorização multiempresa", () => {
  it("injeta sempre a organização ativa nos filtros", () => {
    expect(tenantWhere(sales)).toEqual({ organizationId: "org-a" });
  });

  it("bloqueia acesso a outra organização", () => {
    expect(() => assertTenant(sales, "org-b")).toThrow(/fora da organização ativa/i);
  });

  it("aplica a matriz de permissões no servidor", () => {
    expect(can("SALES", "crm:write")).toBe(true);
    expect(can("SALES", "proposal:approve")).toBe(false);
    expect(can("SUPPORT", "customer:write")).toBe(true);
    expect(can("VIEWER", "customer:write")).toBe(false);
    expect(() => assertPermission(sales, "proposal:approve")).toThrow(/acesso negado/i);
  });
});
