import { Navigate } from "react-router-dom";
import { getStoredUser } from "../api/client";
import type { AuthUser, Role } from "../types";

type RoleRouteProps = {
  roles: Role[];
  children: JSX.Element;
};

export function RoleRoute({ roles, children }: RoleRouteProps) {
  const user = getStoredUser() as AuthUser | null;

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
