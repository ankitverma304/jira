import { Navigate } from "react-router-dom";
import { getStoredToken } from "../api/client";

type ProtectedRouteProps = {
  children: JSX.Element;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (!getStoredToken()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
