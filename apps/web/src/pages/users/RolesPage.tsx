import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, getStoredUser, requireSession } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import type { Role } from "../../types";

const permissionRows = [
  { module: "Projects", view: "All roles", create: "Super Admin, Admin, Project Manager", edit: "Super Admin, Admin, Project Manager" },
  { module: "Tickets", view: "All roles", create: "Super Admin, Admin, Project Manager, Team Lead", edit: "Super Admin, Admin, PM, Team Lead, Developer, QA" },
  { module: "Users", view: "Super Admin, Admin, PM, Team Lead", create: "Super Admin, Admin", edit: "Super Admin, Admin" },
  { module: "Reports", view: "Authenticated users", create: "N/A", edit: "N/A" }
];

export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const currentUser = getStoredUser() as { name?: string; role?: string } | null;

  useEffect(() => {
    void requireSession()
      .then(() => api<{ roles: Role[]; users: unknown[] }>("/users"))
      .then((data) => setRoles(data.roles))
      .catch(console.error);
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Roles"
        title="Roles & Permission Matrix"
        description={`Current signed-in role: ${currentUser?.role ?? "Unknown"}. This page documents seeded roles and route-level responsibilities.`}
        actions={
          <Link className="button ghost" to="/users">
            Back to users
          </Link>
        }
      />
      <section className="workspace-grid">
        <article className="card">
          <h3>Available roles</h3>
          <div className="button-row top-gap">
            {roles.map((role) => (
              <span className="pill" key={role}>
                {role}
              </span>
            ))}
          </div>
        </article>
        <article className="card">
          <h3>Permission guide</h3>
          <div className="list-grid top-gap">
            {permissionRows.map((row) => (
              <div className="list-item static-item" key={row.module}>
                <div>
                  <strong>{row.module}</strong>
                  <p className="muted">View: {row.view}</p>
                  <p className="muted">Create: {row.create}</p>
                  <p className="muted">Edit: {row.edit}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
      <article className="card">
        <h3>Seeded login pattern</h3>
        <p className="muted">All seeded accounts use the same password: <code>admin123</code>.</p>
      </article>
    </>
  );
}
