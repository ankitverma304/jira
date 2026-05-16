import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getStoredUser, requireSession } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { formatShortDate, toLabel } from "../../lib/format";
import { canManageUsers } from "../../lib/permissions";
import type { AuthUser } from "../../types";
import type { Role, UserSummary } from "../../types";

export function UsersListPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const user = getStoredUser() as AuthUser | null;
  const activeUsers = users.filter((entry) => entry.isActive).length;
  const inactiveUsers = users.length - activeUsers;

  useEffect(() => {
    void requireSession()
      .then(() => api<{ users: UserSummary[]; roles: Role[] }>("/users"))
      .then((data) => {
        setUsers(data.users);
        setRoles(data.roles);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load users"));
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Users"
        title="Team Directory"
        description="Manage workspace access, roles, and account status with a cleaner operations view."
        actions={
          <div className="button-row">
            {canManageUsers(user) ? (
              <Link className="button" to="/users/new">
                Add user
              </Link>
            ) : null}
            <Link className="button ghost" to="/roles">
              Roles
            </Link>
          </div>
        }
      />
      {error ? <div className="card error-card">{error}</div> : null}
      <section className="list-overview">
        <article className="card summary-card">
          <p className="eyebrow">Team size</p>
          <h3>{users.length}</h3>
          <p className="muted">User accounts in the workspace</p>
        </article>
        <article className="card summary-card">
          <p className="eyebrow">Active accounts</p>
          <h3>{activeUsers}</h3>
          <p className="muted">People currently enabled to sign in</p>
        </article>
        <article className="card summary-card">
          <p className="eyebrow">Inactive accounts</p>
          <h3>{inactiveUsers}</h3>
          <p className="muted">Profiles disabled from active use</p>
        </article>
      </section>
      <div className="list-grid polished-list-grid">
        {users.map((entry) => (
          <article className="card entity-card polished-card" key={entry.id}>
            <div className="section-header entity-topline">
              <div className="entity-heading">
                <span className="entity-code">{toLabel(entry.role)}</span>
                <h3>{entry.name}</h3>
                <p className="muted">{entry.email}</p>
              </div>
              <div className="entity-badges">
                <span className={`pill ${entry.isActive ? "" : "neutral"}`}>{entry.isActive ? "Active" : "Inactive"}</span>
              </div>
            </div>
            <div className="meta-grid">
              <div className="meta-item">
                <span className="meta-label">Role</span>
                <strong>{toLabel(entry.role)}</strong>
              </div>
              <div className="meta-item">
                <span className="meta-label">Joined</span>
                <strong>{formatShortDate(entry.createdAt)}</strong>
              </div>
              <div className="meta-item">
                <span className="meta-label">Account status</span>
                <strong>{entry.isActive ? "Enabled" : "Disabled"}</strong>
              </div>
            </div>
            {canManageUsers(user) ? (
              <div className="button-row">
                <button className="button ghost" type="button" onClick={() => navigate(`/users/${entry.id}/edit`)}>
                  Edit
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
      <article className="card roles-card">
        <div className="section-header section-spacer">
          <div>
            <p className="eyebrow">Roles</p>
            <h3>Available access levels</h3>
          </div>
          <span className="pill neutral">{roles.length} roles</span>
        </div>
        <div className="tag-row">
          {roles.map((role) => (
            <span className="tag-chip" key={role}>
              {toLabel(role)}
            </span>
          ))}
        </div>
      </article>
    </>
  );
}
