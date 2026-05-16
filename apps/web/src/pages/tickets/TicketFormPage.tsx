import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, requireSession } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { TicketForm, type TicketFormState } from "../../components/TicketForm";
import { splitCsv, toDateInput } from "../../lib/format";
import type { ProjectSummary, TicketDetail, UserSummary } from "../../types";

const emptyTicketForm: TicketFormState = {
  projectId: "",
  title: "",
  description: "",
  priority: "MEDIUM",
  status: "OPEN",
  assigneeId: "",
  reporterId: "",
  startDate: "",
  endDate: "",
  estimatedHours: "",
  actualHours: "",
  tags: "",
  watcherIds: [],
  supportRequired: false,
  isBug: false,
  bugSeverity: "MINOR",
  checklist: ""
};

export function TicketFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [form, setForm] = useState<TicketFormState>(emptyTicketForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const [{ users: userList }, projectList, ticket] = await Promise.all([
        api<{ users: UserSummary[] }>("/users"),
        api<ProjectSummary[]>("/projects"),
        isEdit ? api<TicketDetail>(`/tickets/${id}`) : Promise.resolve(null)
      ]);
      setUsers(userList);
      setProjects(projectList);
      if (ticket) {
        setForm({
          projectId: ticket.projectId,
          title: ticket.title,
          description: ticket.description ?? "",
          priority: ticket.priority,
          status: ticket.status,
          assigneeId: ticket.assigneeId ?? "",
          reporterId: ticket.reporterId ?? "",
          startDate: toDateInput(ticket.startDate),
          endDate: toDateInput(ticket.endDate),
          estimatedHours: ticket.estimatedHours?.toString() ?? "",
          actualHours: ticket.actualHours.toString(),
          tags: ticket.tags.join(", "),
          watcherIds: ticket.watcherIds,
          supportRequired: ticket.supportRequired,
          isBug: ticket.isBug,
          bugSeverity: ticket.bugSeverity ?? "MINOR",
          checklist: ticket.checklistItems?.map((item) => item.title).join(", ") ?? ""
        });
      } else if (projectList[0]) {
        setForm((current) => ({ ...current, projectId: projectList[0].id }));
      }
    }

    void requireSession()
      .then(load)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load ticket form"))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      projectId: form.projectId,
      title: form.title,
      description: form.description,
      priority: form.priority,
      status: form.status,
      assigneeId: form.assigneeId || undefined,
      reporterId: form.reporterId || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
      actualHours: form.actualHours ? Number(form.actualHours) : undefined,
      tags: splitCsv(form.tags),
      watcherIds: form.watcherIds,
      supportRequired: form.supportRequired,
      isBug: form.isBug,
      bugSeverity: form.isBug ? form.bugSeverity : undefined,
      checklist: splitCsv(form.checklist)
    };

    try {
      if (isEdit) {
        await api(`/tickets/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api("/tickets", { method: "POST", body: JSON.stringify(payload) });
      }
      navigate("/tickets");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save ticket");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="card">Loading ticket form…</div>;
  }

  return (
    <>
      <PageHeader
        eyebrow="Tickets"
        title={isEdit ? "Edit Ticket" : "Add Ticket"}
        description="Dedicated ticket form page with its own URL."
        actions={
          <Link className="button ghost" to="/tickets">
            Back to listing
          </Link>
        }
      />
      {error ? <div className="card error-card">{error}</div> : null}
      <article className="card">
        <TicketForm form={form} projects={projects} users={users} onChange={setForm} onSubmit={handleSubmit} submitLabel={isEdit ? "Update ticket" : "Create ticket"} submitting={submitting} />
      </article>
    </>
  );
}
