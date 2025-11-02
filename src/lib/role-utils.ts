// src/lib/role-utils.ts
export type UserRole = "customer" | "vendor" | "admin" | "regional_admin";

export function normalizeRole(role: string): UserRole {
  const normalized = role.toLowerCase();
  if (normalized === "regional_admin") return "regional_admin";
  if (["customer", "vendor", "admin"].includes(normalized)) {
    return normalized as UserRole;
  }
  return "customer"; // default fallback
}

export function isValidRole(role: string): boolean {
  return ["customer", "vendor", "admin", "regional_admin"].includes(role.toLowerCase());
}