import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getStoredUser, requireSession } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { formatShortDate, toLabel } from "../../lib/format";
import { canCreateTicket, canDeleteTicket, canEditTicket } from "../../lib/permissions";
import type { AuthUser } from "../../types";
import type { TicketSummary } from "../../types";

export function TicketListPage() {
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const user = getStoredUser() as AuthUser | null;
  const testingTickets = tickets.filter((ticket) => ticket.status === "TESTING").length;
  const inProgressTickets = tickets.filter((ticket) => ticket.status === "IN_PROGRESS" || ticket.status === "UNDER_REVIEW").length;
  const criticalTickets = tickets.filter((ticket) => ticket.priority === "CRITICAL").length;
  const overdueTickets = tickets.filter((ticket) => ticket.endDate && !["RESOLVED", "CLOSED"].includes(ticket.status) && new Date(ticket.endDate) < new Date()).length;

  async function loadTickets() {
    const data = await api<TicketSummary[]>("/tickets");
    setTickets(data);
  }

  useEffect(() => {
    void requireSession().then(loadTickets).catch((err) => setError(err instanceof Error ? err.message : "Failed to load tickets"));
  }, []);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await api(`/tickets/${id}`, { method: "DELETE" });
      await loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete ticket");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Tickets"
        title="Delivery Queue"
        description="Review work items by ownership, status, and urgency with quick access to view and edit flows."
        actions={canCreateTicket(user) ? (
          <Link className="button" to="/tickets/new">
            Add ticket
          </Link>
        ) : undefined}
      />
      {error ? <div className="card error-card">{error}</div> : null}
      <section className="list-overview">
        <article className="card summary-card">
          <p className="eyebrow">Open queue</p>
          <h3>{tickets.length}</h3>
          <p className="muted">Tickets tracked across projects</p>
        </article>
        <article className="card summary-card">
          <p className="eyebrow">In progress</p>
          <h3>{inProgressTickets}</h3>
          <p className="muted">Tickets actively being worked</p>
        </article>
        <article className="card summary-card">
          <p className="eyebrow">At risk</p>
          <h3>{overdueTickets + criticalTickets}</h3>
          <p className="muted">{overdueTickets} overdue and {criticalTickets} critical priority</p>
        </article>
        <article className="card summary-card">
          <p className="eyebrow">Testing</p>
          <h3>{testingTickets}</h3>
          <p className="muted">Tickets waiting for QA validation</p>
        </article>
      </section>
      <div className="list-grid polished-list-grid">
        {tickets.map((ticket) => (
          <article className="card entity-card polished-card" key={ticket.id}>
            <div className="section-header entity-topline">
              <div className="entity-heading">
                <span className="entity-code">{ticket.ticketNumber}</span>
                <h3>{ticket.title}</h3>
                <p className="muted">{ticket.description || "No description provided."}</p>
              </div>
              <div className="entity-badges">
                <span className="pill">{toLabel(ticket.status)}</span>
                <span className="pill neutral">{toLabel(ticket.priority)}</span>
              </div>
            </div>
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
                <span className="meta-label">Target date</span>
                <strong>{formatShortDate(ticket.endDate)}</strong>
              </div>
              <div className="meta-item">
                <span className="meta-label">Logged hours</span>
                <strong>{ticket.actualHours}</strong>
              </div>
              <div className="meta-item">
                <span className="meta-label">Reporter</span>
                <strong>{ticket.reporter?.name ?? "Not set"}</strong>
              </div>
            </div>
            {ticket.tags.length ? (
              <div className="tag-row">
                {ticket.tags.slice(0, 4).map((tag) => (
                  <span className="tag-chip" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            {ticket.isBug ? (
              <div className="tag-row">
                <span className="tag-chip danger-chip">Bug {ticket.bugSeverity ? `· ${toLabel(ticket.bugSeverity)}` : ""}</span>
              </div>
            ) : null}
            <div className="button-row">
              <button className="button ghost" type="button" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                View
              </button>
              {canEditTicket(user) ? (
                <button className="button ghost" type="button" onClick={() => navigate(`/tickets/${ticket.id}/edit`)}>
                  Edit
                </button>
              ) : null}
              {canDeleteTicket(user) ? (
                <button className="button danger-inline" type="button" onClick={() => void handleDelete(ticket.id)} disabled={deletingId === ticket.id}>
                  Delete
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
