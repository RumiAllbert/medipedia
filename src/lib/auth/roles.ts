import { Role } from "@prisma/client";

const roleRank: Record<Role, number> = {
  [Role.READER]: 10,
  [Role.CONTRIBUTOR]: 20,
  [Role.REVIEWER]: 30,
  [Role.ADMIN]: 40,
};

export function hasRole(userRole: Role | undefined, requiredRole: Role): boolean {
  if (!userRole) return false;
  return roleRank[userRole] >= roleRank[requiredRole];
}

export function normalizeRole(input: string | null | undefined): Role | undefined {
  if (!input) return undefined;
  const value = input.toUpperCase();
  return Object.values(Role).find((role) => role === value) as Role | undefined;
}
