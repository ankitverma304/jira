import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, requireSession } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { ProjectForm, type ProjectFormState } from "../../components/ProjectForm";
import { splitCsv, toDateInput } from "../../lib/format";
import type { ProjectSummary, UserSummary } from "../../types";

const emptyProjectForm: ProjectFormState = {
  code: "",
  name: "",
  description: "",
  clientName: "",
  type: "",
  priority: "MEDIUM",
  status: "NOT_STARTED",
  startDate: "",
  endDate: "",
  expectedDuration: "",
  tags: "",
  managerId: "",
  memberIds: []
};

export function ProjectFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [form, setForm] = useState<ProjectFormState>(emptyProjectForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const [{ users: userList }, project] = await Promise.all([
        api<{ users: UserSummary[] }>("/users"),
        isEdit ? api<ProjectSummary>(`/projects/${id}`) : Promise.resolve(null)
      ]);
      setUsers(userList);
      if (project) {
        setForm({
          code: project.code,
          name: project.name,
          description: project.description ?? "",
          clientName: project.clientName ?? "",
          type: project.type ?? "",
          priority: project.priority,
          status: project.status,
          startDate: toDateInput(project.startDate),
          endDate: toDateInput(project.endDate),
          expectedDuration: project.expectedDuration?.toString() ?? "",
          tags: project.tags.join(", "),
          managerId: project.managerId ?? "",
          memberIds: project.members?.map((member) => member.user.id) ?? []
        });
      }
    }

    void requireSession()
      .then(load)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load project form"))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      code: form.code,
      name: form.name,
      description: form.description,
      clientName: form.clientName,
      type: form.type,
      priority: form.priority,
      status: form.status,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      expectedDuration: form.expectedDuration ? Number(form.expectedDuration) : undefined,
      tags: splitCsv(form.tags),
      managerId: form.managerId || undefined,
      memberIds: form.memberIds
    };

    try {
      if (isEdit) {
        await api(`/projects/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api("/projects", { method: "POST", body: JSON.stringify(payload) });
      }
      navigate("/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save project");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="card">Loading project form…</div>;
  }

  return (
    <>
      <PageHeader
        eyebrow="Projects"
        title={isEdit ? "Edit Project" : "Add Project"}
        description="Dedicated project form page with its own URL."
        actions={
          <Link className="button ghost" to="/projects">
            Back to listing
          </Link>
        }
      />
      {error ? <div className="card error-card">{error}</div> : null}
      <article className="card">
        <ProjectForm form={form} users={users} onChange={setForm} onSubmit={handleSubmit} submitLabel={isEdit ? "Update project" : "Create project"} submitting={submitting} />
      </article>
    </>
  );
}
