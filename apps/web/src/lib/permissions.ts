import type { AuthUser, Role } from "../types";

function hasRole(user: AuthUser | null, roles: Role[]) {
  return !!user && roles.includes(user.role);
}

export function canCreateProject(user: AuthUser | null) {
  return hasRole(user, ["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"]);
}

export function canEditProject(user: AuthUser | null) {
  return hasRole(user, ["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"]);
}

export function canDeleteProject(user: AuthUser | null) {
  return hasRole(user, ["SUPER_ADMIN", "ADMIN"]);
}

export function canCreateTicket(user: AuthUser | null) {
  return hasRole(user, ["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "TEAM_LEAD"]);
}

export function canEditTicket(user: AuthUser | null) {
  return hasRole(user, ["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "TEAM_LEAD", "DEVELOPER", "QA"]);
}

export function canDeleteTicket(user: AuthUser | null) {
  return hasRole(user, ["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"]);
}

export function canViewUsers(user: AuthUser | null) {
  return hasRole(user, ["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "TEAM_LEAD"]);
}

export function canManageUsers(user: AuthUser | null) {
  return hasRole(user, ["SUPER_ADMIN", "ADMIN"]);
}

export function canViewRoles(user: AuthUser | null) {
  return canViewUsers(user);
}
