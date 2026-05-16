import type { FormEvent } from "react";
import { projectPriorities, projectStatuses } from "../lib/constants";
import type { ProjectPriority, ProjectStatus, UserSummary } from "../types";

export type ProjectFormState = {
  code: string;
  name: string;
  description: string;
  clientName: string;
  type: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  expectedDuration: string;
  tags: string;
  managerId: string;
  memberIds: string[];
};

type ProjectFormProps = {
  form: ProjectFormState;
  users: UserSummary[];
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (next: ProjectFormState) => void;
};

export function ProjectForm({ form, users, submitting, submitLabel, onSubmit, onChange }: ProjectFormProps) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <input placeholder="Project code" value={form.code} onChange={(event) => onChange({ ...form, code: event.target.value })} required />
      <input placeholder="Project name" value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} required />
      <input placeholder="Client name" value={form.clientName} onChange={(event) => onChange({ ...form, clientName: event.target.value })} />
      <input placeholder="Project type" value={form.type} onChange={(event) => onChange({ ...form, type: event.target.value })} />
      <select value={form.priority} onChange={(event) => onChange({ ...form, priority: event.target.value as ProjectPriority })}>
        {projectPriorities.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <select value={form.status} onChange={(event) => onChange({ ...form, status: event.target.value as ProjectStatus })}>
        {projectStatuses.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <input type="date" value={form.startDate} onChange={(event) => onChange({ ...form, startDate: event.target.value })} />
      <input type="date" value={form.endDate} onChange={(event) => onChange({ ...form, endDate: event.target.value })} />
      <input placeholder="Expected duration in days" value={form.expectedDuration} onChange={(event) => onChange({ ...form, expectedDuration: event.target.value })} />
      <select value={form.managerId} onChange={(event) => onChange({ ...form, managerId: event.target.value })}>
        <option value="">Select manager</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} · {user.role}
          </option>
        ))}
      </select>
      <input className="full-span" placeholder="Tags, comma separated" value={form.tags} onChange={(event) => onChange({ ...form, tags: event.target.value })} />
      <textarea className="full-span" placeholder="Description" value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} rows={4} />
      <label className="full-span">
        Team members
        <select
          multiple
          className="multi-select"
          value={form.memberIds}
          onChange={(event) =>
            onChange({
              ...form,
              memberIds: Array.from(event.target.selectedOptions).map((option) => option.value)
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
      <button className="button" type="submit" disabled={submitting}>
        {submitLabel}
      </button>
    </form>
  );
}
