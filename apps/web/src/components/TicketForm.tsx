import type { FormEvent } from "react";
import { bugSeverities, ticketPriorities, ticketStatuses } from "../lib/constants";
import type { BugSeverity, ProjectSummary, TicketPriority, TicketStatus, UserSummary } from "../types";

export type TicketFormState = {
  projectId: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assigneeId: string;
  reporterId: string;
  startDate: string;
  endDate: string;
  estimatedHours: string;
  actualHours: string;
  tags: string;
  watcherIds: string[];
  supportRequired: boolean;
  isBug: boolean;
  bugSeverity: BugSeverity;
  checklist: string;
};

type TicketFormProps = {
  form: TicketFormState;
  projects: ProjectSummary[];
  users: UserSummary[];
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (next: TicketFormState) => void;
};

export function TicketForm({ form, projects, users, submitting, submitLabel, onSubmit, onChange }: TicketFormProps) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <select value={form.projectId} onChange={(event) => onChange({ ...form, projectId: event.target.value })} required>
        <option value="">Select project</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.code} · {project.name}
          </option>
        ))}
      </select>
      <input placeholder="Ticket title" value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} required />
      <select value={form.priority} onChange={(event) => onChange({ ...form, priority: event.target.value as TicketPriority })}>
        {ticketPriorities.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <select value={form.status} onChange={(event) => onChange({ ...form, status: event.target.value as TicketStatus })}>
        {ticketStatuses.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <select value={form.assigneeId} onChange={(event) => onChange({ ...form, assigneeId: event.target.value })}>
        <option value="">Select assignee</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} · {user.role}
          </option>
        ))}
      </select>
      <select value={form.reporterId} onChange={(event) => onChange({ ...form, reporterId: event.target.value })}>
        <option value="">Select reporter</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} · {user.role}
          </option>
        ))}
      </select>
      <input placeholder="Estimated hours" value={form.estimatedHours} onChange={(event) => onChange({ ...form, estimatedHours: event.target.value })} />
      <input type="date" value={form.startDate} onChange={(event) => onChange({ ...form, startDate: event.target.value })} />
      <input type="date" value={form.endDate} onChange={(event) => onChange({ ...form, endDate: event.target.value })} />
      <input placeholder="Actual hours" value={form.actualHours} onChange={(event) => onChange({ ...form, actualHours: event.target.value })} />
      <input className="full-span" placeholder="Tags, comma separated" value={form.tags} onChange={(event) => onChange({ ...form, tags: event.target.value })} />
      <label className="checkbox-row full-span">
        <input type="checkbox" checked={form.isBug} onChange={(event) => onChange({ ...form, isBug: event.target.checked })} />
        Mark as bug ticket
      </label>
      {form.isBug ? (
        <select value={form.bugSeverity} onChange={(event) => onChange({ ...form, bugSeverity: event.target.value as BugSeverity })}>
          {bugSeverities.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      ) : null}
      <label className="field-stack full-span">
        <span>Watchers</span>
        <select
          multiple
          value={form.watcherIds}
          onChange={(event) =>
            onChange({
              ...form,
              watcherIds: Array.from(event.target.selectedOptions).map((option) => option.value)
            })
          }
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} · {user.role}
            </option>
          ))}
        </select>
      </label>
      <input className="full-span" placeholder="Checklist items, comma separated" value={form.checklist} onChange={(event) => onChange({ ...form, checklist: event.target.value })} />
      <textarea className="full-span" placeholder="Ticket description" value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} rows={4} />
      <label className="checkbox-row full-span">
        <input type="checkbox" checked={form.supportRequired} onChange={(event) => onChange({ ...form, supportRequired: event.target.checked })} />
        Support required
      </label>
      <button className="button" type="submit" disabled={submitting}>
        {submitLabel}
      </button>
    </form>
  );
}
