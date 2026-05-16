import { useEffect, useState } from "react";
import { api, getStoredUser, requireSession } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { formatShortDate, toLabel } from "../lib/format";
import type { AuthUser, BugAnalytics, ReportOverview, TaskReport, TimelineReport, UserReport } from "../types";
import type { ProjectReport } from "../types";

export function ReportsPage() {
  const currentUser = getStoredUser() as AuthUser | null;
  const [overview, setOverview] = useState<ReportOverview | null>(null);
  const [userReport, setUserReport] = useState<UserReport[]>([]);
  const [projectReport, setProjectReport] = useState<ProjectReport[]>([]);
  const [taskReport, setTaskReport] = useState<TaskReport[]>([]);
  const [bugAnalytics, setBugAnalytics] = useState<BugAnalytics | null>(null);
  const [timeline, setTimeline] = useState<TimelineReport | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    void requireSession()
      .then(() =>
        Promise.all([
          api<ReportOverview>("/reports/overview").then(setOverview),
          api<UserReport[]>("/reports/user-wise").then(setUserReport),
          api<ProjectReport[]>("/reports/project-wise").then(setProjectReport),
          api<TaskReport[]>("/reports/task-wise").then(setTaskReport),
          api<BugAnalytics>("/reports/bug-analytics").then(setBugAnalytics),
          api<TimelineReport>(`/reports/timeline/${currentUser.id}`).then(setTimeline)
        ])
      )
      .catch(console.error);
  }, [currentUser]);

  const leaderboard = (overview?.leaderboard ?? []).slice(0, 8);
  const recentTasks = taskReport.slice(0, 8);
  const activeProjects = projectReport.slice(0, 6);

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="Reports & Analytics"
        description="Operational analytics for points, bugs, team effort, project progress, and overdue execution risk."
      />

      <section className="workspace-grid report-grid">
        <article className="card report-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Leaderboard</p>
              <h3>Developer points</h3>
            </div>
            <span className="pill neutral">Net score</span>
          </div>
          <ul className="plain-list report-list">
            {leaderboard.map((entry, index) => (
              <li key={entry.id}>
                <span>
                  {index + 1}. {entry.name} · {toLabel(entry.role)}
                </span>
                <strong>{entry.totalPoints}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="card report-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Bug Analytics</p>
              <h3>Severity breakdown</h3>
            </div>
            <span className="pill">{bugAnalytics?.total ?? 0} issues</span>
          </div>
          <ul className="plain-list report-list">
            {Object.entries(bugAnalytics?.bySeverity ?? {}).map(([severity, count]) => (
              <li key={severity}>
                <span>{toLabel(severity)}</span>
                <strong>{count}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="card report-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">My Timeline</p>
              <h3>Daily hours</h3>
            </div>
            <span className="pill neutral">{timeline?.totals.loggedHours ?? 0}h</span>
          </div>
          <ul className="plain-list report-list">
            {(timeline?.dailyHours ?? []).slice(0, 7).map((entry) => (
              <li key={entry.date}>
                <span>{entry.date}</span>
                <strong>{entry.hours}h</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="card report-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Status Mix</p>
              <h3>Workflow distribution</h3>
            </div>
            <span className="pill neutral">{Object.keys(overview?.ticketsByStatus ?? {}).length} stages</span>
          </div>
          <ul className="plain-list report-list">
            {Object.entries(overview?.ticketsByStatus ?? {}).map(([status, count]) => (
              <li key={status}>
                <span>{toLabel(status)}</span>
                <strong>{count}</strong>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="dashboard-panels">
        <article className="card dashboard-panel">
          <div className="section-header section-spacer">
            <div>
              <p className="eyebrow">User Performance</p>
              <h3>Team scorecards</h3>
            </div>
          </div>
          <div className="report-table">
            {userReport.map((item) => (
              <div className="report-table-row" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <p className="muted">{toLabel(item.role)}</p>
                </div>
                <span>{item.loggedHours}h</span>
                <span>{item.assignedTickets} tickets</span>
                <span>{item.onTime} on time</span>
                <strong>{item.totalPoints} pts</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-panels">
        <article className="card dashboard-panel">
          <div className="section-header section-spacer">
            <div>
              <p className="eyebrow">Project Progress</p>
              <h3>Delivery status by project</h3>
            </div>
          </div>
          <div className="report-table compact-table">
            {activeProjects.map((item) => (
              <div className="report-table-row" key={item.id}>
                <div>
                  <strong>
                    {item.code} · {item.name}
                  </strong>
                  <p className="muted">{toLabel(item.status)}</p>
                </div>
                <span>{item.completedTickets}/{item.tickets} done</span>
                <span>{item.overdueTickets} overdue</span>
                <strong>{item.actualHours}/{item.estimatedHours}h</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="card dashboard-panel">
          <div className="section-header section-spacer">
            <div>
              <p className="eyebrow">Recent Ticket Load</p>
              <h3>Task-level delivery signals</h3>
            </div>
          </div>
          <div className="report-table compact-table">
            {recentTasks.map((item) => (
              <div className="report-table-row" key={item.id}>
                <div>
                  <strong>
                    {item.ticketNumber} · {item.title}
                  </strong>
                  <p className="muted">
                    {item.project.code} · {item.assignee ?? "Unassigned"}
                  </p>
                </div>
                <span>{toLabel(item.status)}</span>
                <span>{toLabel(item.priority)}</span>
                <strong>{item.actualHours}/{item.estimatedHours}h</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="dashboard-panels">
        <article className="card dashboard-panel">
          <div className="section-header section-spacer">
            <div>
              <p className="eyebrow">Recent Bugs</p>
              <h3>QA feedback and severity</h3>
            </div>
          </div>
          <div className="report-table compact-table">
            {(bugAnalytics?.recent ?? []).slice(0, 8).map((bug) => (
              <div className="report-table-row" key={bug.id}>
                <div>
                  <strong>
                    {bug.ticket.ticketNumber} · {bug.ticket.title}
                  </strong>
                  <p className="muted">Reported by {bug.reportedBy.name}</p>
                </div>
                <span>{toLabel(bug.severity)}</span>
                <span>{bug.fixMinutes ?? 0} min</span>
                <strong>{formatShortDate(bug.createdAt)}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="card dashboard-panel">
          <div className="section-header section-spacer">
            <div>
              <p className="eyebrow">My Point Events</p>
              <h3>Recent performance changes</h3>
            </div>
          </div>
          <div className="report-table compact-table">
            {(timeline?.pointEvents ?? []).slice(0, 8).map((entry) => (
              <div className="report-table-row" key={entry.id}>
                <div>
                  <strong>{toLabel(entry.eventType)}</strong>
                  <p className="muted">{entry.notes ?? "Automatic workflow update"}</p>
                </div>
                <span>{entry.bugSeverity ? toLabel(entry.bugSeverity) : "Task"}</span>
                <strong className={entry.delta >= 0 ? "trend-positive" : "trend-negative"}>
                  {entry.delta >= 0 ? `+${entry.delta}` : entry.delta}
                </strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
