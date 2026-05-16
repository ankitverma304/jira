import type { FormEvent } from "react";
import type { Role } from "../types";

export type UserFormState = {
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  password: string;
};

type UserFormProps = {
  form: UserFormState;
  roles: Role[];
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (next: UserFormState) => void;
};

export function UserForm({ form, roles, submitting, submitLabel, onSubmit, onChange }: UserFormProps) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <input placeholder="Full name" value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} required />
      <input placeholder="Email" type="email" value={form.email} onChange={(event) => onChange({ ...form, email: event.target.value })} required />
      <select value={form.role} onChange={(event) => onChange({ ...form, role: event.target.value as Role })}>
        {roles.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
      <input placeholder="Password" type="password" value={form.password} onChange={(event) => onChange({ ...form, password: event.target.value })} />
      <label className="checkbox-row full-span">
        <input type="checkbox" checked={form.isActive} onChange={(event) => onChange({ ...form, isActive: event.target.checked })} />
        Active user
      </label>
      <button className="button" type="submit" disabled={submitting}>
        {submitLabel}
      </button>
    </form>
  );
}
