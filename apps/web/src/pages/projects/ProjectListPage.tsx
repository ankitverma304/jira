import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getStoredUser, requireSession } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { formatShortDate, toLabel } from "../../lib/format";
import { canCreateProject, canDeleteProject, canEditProject } from "../../lib/permissions";
import type { AuthUser } from "../../types";
import type { ProjectSummary } from "../../types";

export function ProjectListPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const user = getStoredUser() as AuthUser | null;
  const activeProjects = projects.filter((project) => project.status === "ACTIVE").length;
  const criticalProjects = projects.filter((project) => project.priority === "CRITICAL").length;

  async function loadProjects() {
    const data = await api<ProjectSummary[]>("/projects");
    setProjects(data);
  }

  useEffect(() => {
    void requireSession().then(loadProjects).catch((err) => setError(err instanceof Error ? err.message : "Failed to load projects"));
  }, []);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await api(`/projects/${id}`, { method: "DELETE" });
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Projects"
        title="Project Portfolio"
        description="Monitor project status, ownership, and delivery pressure from a single operational list."
        actions={canCreateProject(user) ? (
          <Link className="button" to="/projects/new">
            Add project
          </Link>
        ) : undefined}
      />
      {error ? <div className="card error-card">{error}</div> : null}
      <section className="list-overview">
        <article className="card summary-card">
          <p className="eyebrow">Portfolio size</p>
          <h3>{projects.length}</h3>
          <p className="muted">Tracked projects in the workspace</p>
        </article>
        <article className="card summary-card">
          <p className="eyebrow">Active delivery</p>
          <h3>{activeProjects}</h3>
          <p className="muted">Projects currently in execution</p>
        </article>
        <article className="card summary-card">
          <p className="eyebrow">Critical priority</p>
          <h3>{criticalProjects}</h3>
          <p className="muted">Projects marked for close attention</p>
        </article>
      </section>
      <div className="list-grid polished-list-grid">
        {projects.map((project) => (
          <article className="card entity-card polished-card" key={project.id}>
            <div className="section-header entity-topline">
              <div className="entity-heading">
                <span className="entity-code">{project.code}</span>
                <h3>{project.name}</h3>
                <p className="muted">{project.description || "No description provided."}</p>
              </div>
              <div className="entity-badges">
                <span className="pill">{toLabel(project.status)}</span>
                <span className="pill neutral">{toLabel(project.priority)}</span>
              </div>
            </div>
            <div className="meta-grid">
              <div className="meta-item">
                <span className="meta-label">Manager</span>
                <strong>{project.manager?.name ?? "No manager"}</strong>
              </div>
              <div className="meta-item">
                <span className="meta-label">Client</span>
                <strong>{project.clientName || "Internal"}</strong>
              </div>
              <div className="meta-item">
                <span className="meta-label">Timeline</span>
                <strong>{formatShortDate(project.startDate)}</strong>
              </div>
              <div className="meta-item">
                <span className="meta-label">Tickets</span>
                <strong>{project._count?.tickets ?? 0}</strong>
              </div>
            </div>
            {project.tags.length ? (
              <div className="tag-row">
                {project.tags.slice(0, 4).map((tag) => (
                  <span className="tag-chip" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            {canEditProject(user) || canDeleteProject(user) ? (
              <div className="button-row">
                {canEditProject(user) ? (
                  <button className="button ghost" type="button" onClick={() => navigate(`/projects/${project.id}/edit`)}>
                    Edit
                  </button>
                ) : null}
                {canDeleteProject(user) ? (
                  <button className="button danger-inline" type="button" onClick={() => void handleDelete(project.id)} disabled={deletingId === project.id}>
                    Delete
                  </button>
                ) : null}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </>
  );
}
