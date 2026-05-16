import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, requireSession } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { UserForm, type UserFormState } from "../../components/UserForm";
import type { Role, UserSummary } from "../../types";

const emptyUserForm: UserFormState = {
  name: "",
  email: "",
  role: "USER",
  isActive: true,
  password: ""
};

export function UsersFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState<UserFormState>(emptyUserForm);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const [userPayload, user] = await Promise.all([
        api<{ users: UserSummary[]; roles: Role[] }>("/users"),
        isEdit ? api<UserSummary>(`/users/${id}`) : Promise.resolve(null)
      ]);

      setRoles(userPayload.roles);
      if (user) {
        setForm({
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          password: ""
        });
      } else {
        setForm((current) => ({ ...current, role: userPayload.roles[0] ?? "USER" }));
      }
    }

    void requireSession()
      .then(load)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load user form"))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      name: form.name,
      email: form.email,
      role: form.role,
      isActive: form.isActive,
      password: form.password || undefined
    };

    try {
      if (isEdit) {
        await api(`/users/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api(`/users`, { method: "POST", body: JSON.stringify(payload) });
      }
      navigate("/users");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="card">Loading user form…</div>;
  }

  return (
    <>
      <PageHeader
        eyebrow="Users"
        title={isEdit ? "Edit User" : "Add User"}
        description="Dedicated user management form page."
        actions={
          <Link className="button ghost" to="/users">
            Back to listing
          </Link>
        }
      />
      {error ? <div className="card error-card">{error}</div> : null}
      <article className="card">
        <UserForm form={form} roles={roles} submitting={submitting} submitLabel={isEdit ? "Update user" : "Create user"} onSubmit={handleSubmit} onChange={setForm} />
      </article>
    </>
  );
}
