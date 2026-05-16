import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, requireSession } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { toLabel } from "../lib/format";
import type { ReportOverview } from "../types";

export function DashboardPage() {
  const [overview, setOverview] = useState<ReportOverview | null>(null);
  const statusEntries = Object.entries(overview?.ticketsByStatus ?? {}).sort(([, left], [, right]) => right - left);
  const completionRows = (overview?.projectCompletion ?? []).slice(0, 4);
  const leaderboard = (overview?.leaderboard ?? []).slice(0, 5);
  const pointsTrend = (overview?.pointsTrend ?? []).slice(-6);

  useEffect(() => {
    void requireSession().then(() => api<ReportOverview>("/reports/overview").then(setOverview)).catch(console.error);
  }, []);

  return (
    <>
      <section className="hero hero-dashboard">
        <div className="hero-copy-block">
          <p className="eyebrow inverse-eyebrow">Project Operations</p>
          <h2>Clear operational visibility for projects, tickets, and delivery work.</h2>
          <p className="hero-copy">
            Review portfolio health, overdue delivery risk, and developer performance from a single operational surface designed for
            PMs, team leads, QA, and engineering managers.
          </p>
        </div>
        <div className="hero-panel">
          <span className="hero-panel-label">Workspace health</span>
          <strong>{overview?.stats.overdueTickets ?? 0} overdue tickets need intervention</strong>
          <p>{overview?.stats.bugCount ?? 0} bug-linked tickets currently affect delivery quality and downstream testing.</p>
        </div>
      </section>

      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="A management view for pipeline health, project progress, and team workload signals."
        actions={
          <div className="button-row">
            <Link className="button" to="/projects">
              Projects
            </Link>
            <Link className="button ghost" to="/tickets">
              Tickets
            </Link>
          </div>
        }
      />

      <section className="grid stats-grid">
        <StatCard label="Projects" value={overview?.stats.totalProjects ?? 0} helper="Active delivery portfolio" />
        <StatCard label="Tickets" value={overview?.stats.totalTickets ?? 0} helper="Across all tracked workstreams" />
        <StatCard label="Users" value={overview?.stats.totalUsers ?? 0} helper="People with workspace access" />
        <StatCard label="Logged Hours" value={overview?.stats.totalLoggedHours ?? 0} helper="Effort recorded by the team" />
        <StatCard label="Overdue" value={overview?.stats.overdueTickets ?? 0} helper="Tickets beyond due date" />
        <StatCard label="Bug Tickets" value={overview?.stats.bugCount ?? 0} helper="Work items marked as bugs" />
      </section>

      <section className="dashboard-panels">
        <article className="card dashboard-panel">
          <div className="section-header section-spacer">
            <div>
              <p className="eyebrow">Ticket flow</p>
              <h3>Status distribution</h3>
            </div>
            <span className="pill neutral">{statusEntries.length} statuses</span>
          </div>
          <div className="status-stack">
            {statusEntries.length ? (
              statusEntries.map(([status, count]) => (
                <div className="status-row" key={status}>
                  <div>
                    <strong>{status.split("_").join(" ")}</strong>
                    <p className="muted">Current ticket volume</p>
                  </div>
                  <span className="status-value">{count}</span>
                </div>
              ))
            ) : (
              <p className="muted">No ticket activity available yet.</p>
            )}
          </div>
        </article>

        <article className="card dashboard-panel">
          <div className="section-header section-spacer">
            <div>
              <p className="eyebrow">Delivery</p>
              <h3>Project completion</h3>
            </div>
            <Link className="button ghost" to="/reports">
              Open reports
            </Link>
          </div>
          <div className="progress-stack">
            {completionRows.length ? (
              completionRows.map((project) => (
                <div className="progress-row" key={project.projectId}>
                  <div className="progress-row-copy">
                    <strong>{project.projectName}</strong>
                    <p className="muted">
                      {project.doneTickets}/{project.totalTickets} completed · {project.overdueTickets} overdue
                    </p>
                  </div>
                  <div className="progress-meter">
                    <div className="progress-bar">
                      <span style={{ width: `${project.completionRate}%` }} />
                    </div>
                    <span className="status-value">{project.completionRate}%</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">Completion data will appear after tickets are created.</p>
            )}
          </div>
        </article>
      </section>

      <section className="dashboard-panels">
        <article className="card dashboard-panel">
          <div className="section-header section-spacer">
            <div>
              <p className="eyebrow">Performance</p>
              <h3>Points leaderboard</h3>
            </div>
            <span className="pill neutral">Top 5</span>
          </div>
          <div className="status-stack">
            {leaderboard.length ? (
              leaderboard.map((member, index) => (
                <div className="status-row" key={member.id}>
                  <div>
                    <strong>
                      {index + 1}. {member.name}
                    </strong>
                    <p className="muted">{toLabel(member.role)}</p>
                  </div>
                  <span className="status-value">{member.totalPoints}</span>
                </div>
              ))
            ) : (
              <p className="muted">Point events will populate the leaderboard once tickets move through testing and resolution.</p>
            )}
          </div>
        </article>

        <article className="card dashboard-panel">
          <div className="section-header section-spacer">
            <div>
              <p className="eyebrow">Momentum</p>
              <h3>Recent point trend</h3>
            </div>
            <Link className="button ghost" to="/reports">
              View analytics
            </Link>
          </div>
          <div className="trend-list">
            {pointsTrend.length ? (
              pointsTrend.map((entry) => (
                <div className="trend-row" key={entry.date}>
                  <span>{entry.date}</span>
                  <strong className={entry.delta >= 0 ? "trend-positive" : "trend-negative"}>
                    {entry.delta >= 0 ? `+${entry.delta}` : entry.delta}
                  </strong>
                </div>
              ))
            ) : (
              <p className="muted">Point activity will appear after workflow events are recorded.</p>
            )}
          </div>
        </article>
      </section>
    </>
  );
}
