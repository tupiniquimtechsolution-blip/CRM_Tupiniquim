export const roles = ["OWNER", "ADMIN", "MANAGER", "SALES", "SUPPORT", "VIEWER"] as const;
export type AppRole = (typeof roles)[number];

export type TenantActor = {
  userId: string;
  organizationId: string;
  organizationName: string;
  role: AppRole;
};

const permissionMatrix: Record<AppRole, ReadonlySet<string>> = {
  OWNER: new Set(["*"]),
  ADMIN: new Set(["*"]),
  MANAGER: new Set(["crm:read", "crm:write", "pipeline:write", "proposal:approve", "reports:read", "reports:export", "customer:read", "customer:write", "automation:read", "automation:write", "automation:publish", "integration:write", "integration:approve", "ai:use", "ai:review", "privacy:read"]),
  SALES: new Set(["crm:read", "crm:write", "pipeline:write", "proposal:write", "reports:read", "reports:export", "customer:read", "customer:write", "automation:read", "ai:use"]),
  SUPPORT: new Set(["crm:read", "activity:write", "reports:read", "customer:read", "customer:write", "automation:read", "ai:use"]),
  VIEWER: new Set(["crm:read", "reports:read", "customer:read"]),
};

export function can(role: AppRole, permission: string) {
  const permissions = permissionMatrix[role];
  return permissions.has("*") || permissions.has(permission);
}

export function assertPermission(actor: TenantActor, permission: string) {
  if (!can(actor.role, permission)) {
    throw new Error("Acesso negado para esta operação.");
  }
}

export function assertTenant(actor: TenantActor, organizationId: string) {
  if (actor.organizationId !== organizationId) {
    throw new Error("Tentativa de acesso fora da organização ativa.");
  }
}

export function tenantWhere(actor: TenantActor) {
  return { organizationId: actor.organizationId } as const;
}
