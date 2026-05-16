import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleRoute } from "./components/RoleRoute";
import { AppShell } from "./layouts/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { ReportsPage } from "./pages/ReportsPage";
import { ProjectFormPage } from "./pages/projects/ProjectFormPage";
import { ProjectListPage } from "./pages/projects/ProjectListPage";
import { TicketDetailPage } from "./pages/tickets/TicketDetailPage";
import { TicketFormPage } from "./pages/tickets/TicketFormPage";
import { TicketListPage } from "./pages/tickets/TicketListPage";
import { UsersFormPage } from "./pages/users/UsersFormPage";
import { UsersListPage } from "./pages/users/UsersListPage";
import { RolesPage } from "./pages/users/RolesPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/projects" element={<ProjectListPage />} />
                <Route path="/projects/new" element={<RoleRoute roles={["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"]}><ProjectFormPage /></RoleRoute>} />
                <Route path="/projects/:id/edit" element={<RoleRoute roles={["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER"]}><ProjectFormPage /></RoleRoute>} />
                <Route path="/tickets" element={<TicketListPage />} />
                <Route path="/tickets/new" element={<RoleRoute roles={["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "TEAM_LEAD"]}><TicketFormPage /></RoleRoute>} />
                <Route path="/tickets/:id" element={<TicketDetailPage />} />
                <Route path="/tickets/:id/edit" element={<RoleRoute roles={["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "TEAM_LEAD", "DEVELOPER", "QA"]}><TicketFormPage /></RoleRoute>} />
                <Route path="/users" element={<RoleRoute roles={["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "TEAM_LEAD"]}><UsersListPage /></RoleRoute>} />
                <Route path="/users/new" element={<RoleRoute roles={["SUPER_ADMIN", "ADMIN"]}><UsersFormPage /></RoleRoute>} />
                <Route path="/users/:id/edit" element={<RoleRoute roles={["SUPER_ADMIN", "ADMIN"]}><UsersFormPage /></RoleRoute>} />
                <Route path="/roles" element={<RoleRoute roles={["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "TEAM_LEAD"]}><RolesPage /></RoleRoute>} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
