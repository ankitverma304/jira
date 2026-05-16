import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, getStoredUser, requireSession } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { canEditTicket } from "../../lib/permissions";
import { formatShortDate, toLabel } from "../../lib/format";
import type { AuthUser, TicketDetail } from "../../types";

export function TicketDetailPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [comment, setComment] = useState("");
  const [timeHours, setTimeHours] = useState("");
  const [timeDescription, setTimeDescription] = useState("");
  const [timeDate, setTimeDate] = useState(new Date().toISOString().slice(0, 10));
  const [isBillable, setIsBillable] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const user = getStoredUser() as AuthUser | null;

  async function loadTicket() {
    if (!id) return;
    const data = await api<TicketDetail>(`/tickets/${id}`);
    setTicket(data);
  }

  useEffect(() => {
    void requireSession().then(loadTicket).catch((err) => setError(err instanceof Error ? err.message : "Failed to load ticket"));
  }, [id]);

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;
    setSubmitting("comment");
    try {
      await api(`/tickets/${id}/comments`, { method: "POST", body: JSON.stringify({ content: comment, mentions: [] }) });
      setComment("");
      await loadTicket();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setSubmitting(null);
    }
  }

  async function submitTimeLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;
    setSubmitting("time");
    try {
      await api(`/tickets/${id}/time-logs`, {
        method: "POST",
        body: JSON.stringify({
          hours: Number(timeHours),
          description: timeDescription,
          workDate: timeDate,
          isBillable
        })
      });
      setTimeHours("");
      setTimeDescription("");
      await loadTicket();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log time");
    } finally {
      setSubmitting(null);
    }
  }

  if (!ticket) {
    return <div className="card">Loading ticket detail…</div>;
  }

  const checklistDone = ticket.checklistItems?.filter((item) => item.completed).length ?? 0;
  const checklistTotal = ticket.checklistItems?.length ?? 0;
  const pointsTotal = ticket.pointEvents.reduce((sum, entry) => sum + entry.delta, 0);

  return (
    <>
      <PageHeader
        eyebrow="Ticket Detail"
        title={`${ticket.ticketNumber} · ${ticket.title}`}
        description="Workflow, performance, bug tracking, comments, dependencies, and time history for a single work item."
        actions={
          <div className="button-row">
            <Link className="button ghost" to="/tickets">
              Back to listing
            </Link>
            {canEditTicket(user) ? (
              <Link className="button" to={`/tickets/${ticket.id}/edit`}>
                Edit ticket
              </Link>
            ) : null}
          </div>
        }
      />
      {error ? <div className="card error-card">{error}</div> : null}

      <section className="detail-hero">
        <article className="card detail-masthead">
          <div className="entity-badges">
            <span className="pill">{toLabel(ticket.status)}</span>
            <span className="pill neutral">{toLabel(ticket.priority)}</span>
            {ticket.isBug ? <span className="pill danger-pill">Bug {ticket.bugSeverity ? `· ${toLabel(ticket.bugSeverity)}` : ""}</span> : null}
          </div>
          <p className="muted detail-copy">{ticket.description || "No detailed description has been added to this ticket yet."}</p>
          <div className="meta-grid">
            <div className="meta-item">
              <span className="meta-label">Project</span>
              <strong>{ticket.project.code}</strong>
            </div>
            <div className="meta-item">
              <span className="meta-label">Assignee</span>
              <strong>{ticket.assignee?.name ?? "Unassigned"}</strong>
            </div>
            <div className="meta-item">
              <span className="meta-label">Reporter</span>
              <strong>{ticket.reporter?.name ?? "Unknown"}</strong>
            </div>
            <div className="meta-item">
              <span className="meta-label">Due date</span>
              <strong>{formatShortDate(ticket.endDate)}</strong>
            </div>
            <div className="meta-item">
              <span className="meta-label">Hours</span>
              <strong>
                {ticket.actualHours}/{ticket.estimatedHours ?? 0}h
              </strong>
            </div>
            <div className="meta-item">
              <span className="meta-label">Net points</span>
              <strong>{pointsTotal}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="workspace-grid detail-grid">
        <article className="card detail-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Execution</p>
              <h3>Checklist & dependencies</h3>
            </div>
            <span className="pill neutral">
              {checklistDone}/{checklistTotal} complete
            </span>
          </div>
          <ul className="plain-list">
            {ticket.checklistItems?.length ? (
              ticket.checklistItems.map((item) => (
                <li key={item.id}>
                  <span>{item.title}</span>
                  <strong>{item.completed ? "Done" : "Open"}</strong>
                </li>
              ))
            ) : (
              <li>
                <span>No checklist items defined.</span>
                <strong>Empty</strong>
              </li>
            )}
          </ul>
          <h4>Dependencies</h4>
          <ul className="plain-list">
            {ticket.dependenciesFrom.length ? (
              ticket.dependenciesFrom.map((dependency) => (
                <li key={dependency.id}>
                  <span>
                    {dependency.dependsOnTicket.ticketNumber} · {dependency.dependsOnTicket.title}
                  </span>
                  <strong>{toLabel(dependency.dependsOnTicket.status)}</strong>
                </li>
              ))
            ) : (
              <li>
                <span>No blockers recorded.</span>
                <strong>Clear</strong>
              </li>
            )}
          </ul>
        </article>

        <article className="card detail-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Quality</p>
              <h3>Bug history & points</h3>
            </div>
            <span className="pill neutral">{ticket.bugs.length} bug events</span>
          </div>
          <ul className="plain-list">
            {ticket.bugs.length ? (
              ticket.bugs.map((bug) => (
                <li key={bug.id}>
                  <span>
                    {toLabel(bug.severity)} bug logged by {bug.reportedBy.name}
                  </span>
                  <strong>{bug.fixMinutes ?? 0} min</strong>
                </li>
              ))
            ) : (
              <li>
                <span>No bug events logged.</span>
                <strong>Clean</strong>
              </li>
            )}
          </ul>
          <h4>Point events</h4>
          <ul className="plain-list">
            {ticket.pointEvents.length ? (
              ticket.pointEvents.map((entry) => (
                <li key={entry.id}>
                  <span>{entry.notes ?? toLabel(entry.eventType)}</span>
                  <strong className={entry.delta >= 0 ? "trend-positive" : "trend-negative"}>
                    {entry.delta >= 0 ? `+${entry.delta}` : entry.delta}
                  </strong>
                </li>
              ))
            ) : (
              <li>
                <span>No points recorded yet.</span>
                <strong>Pending</strong>
              </li>
            )}
          </ul>
        </article>

        <article className="card detail-panel full-width-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">Audit</p>
              <h3>Ticket history</h3>
            </div>
          </div>
          <ul className="plain-list history-list">
            {ticket.histories.map((entry) => (
              <li key={entry.id}>
                <span>
                  {entry.actor.name} · {entry.description ?? entry.type}
                </span>
                <strong>{new Date(entry.createdAt).toLocaleString()}</strong>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="dashboard-panels">
        <form className="card detail-panel stacked-form" onSubmit={submitComment}>
          <div className="section-header">
            <div>
              <p className="eyebrow">Collaboration</p>
              <h3>Comments</h3>
            </div>
            <span className="pill neutral">{ticket.comments.length}</span>
          </div>
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={4} placeholder="Add comment" required />
          <button className="button" type="submit" disabled={submitting === "comment"}>
            Add comment
          </button>
          <ul className="plain-list">
            {ticket.comments.map((entry) => (
              <li key={entry.id}>
                <span>
                  {entry.author.name}: {entry.content}
                </span>
                <strong>{new Date(entry.createdAt).toLocaleString()}</strong>
              </li>
            ))}
          </ul>
        </form>

        <form className="card detail-panel stacked-form" onSubmit={submitTimeLog}>
          <div className="section-header">
            <div>
              <p className="eyebrow">Time Tracking</p>
              <h3>Work log</h3>
            </div>
            <span className="pill neutral">{ticket.timeLogs.length} entries</span>
          </div>
          <input value={timeHours} onChange={(event) => setTimeHours(event.target.value)} placeholder="Hours" required />
          <input type="date" value={timeDate} onChange={(event) => setTimeDate(event.target.value)} required />
          <input value={timeDescription} onChange={(event) => setTimeDescription(event.target.value)} placeholder="What was done" />
          <label className="checkbox-row">
            <input type="checkbox" checked={isBillable} onChange={(event) => setIsBillable(event.target.checked)} />
            Billable entry
          </label>
          <button className="button" type="submit" disabled={submitting === "time"}>
            Log time
          </button>
          <ul className="plain-list">
            {ticket.timeLogs.map((entry) => (
              <li key={entry.id}>
                <span>
                  {entry.user.name} · {entry.description || "Work log"}
                </span>
                <strong>
                  {entry.hours}h · {entry.isBillable ? "Billable" : "Non-billable"}
                </strong>
              </li>
            ))}
          </ul>
        </form>
      </section>
    </>
  );
}
