const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
const TOKEN_KEY = "projectmgt-token";
const USER_KEY = "projectmgt-user";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const demoToken = window.localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(demoToken ? { Authorization: `Bearer ${demoToken}` } : {}),
      ...init?.headers
    }
  });

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({ message: "Request failed" }))) as { message?: string };
    throw new Error(payload.message ?? `Request failed: ${response.status}`);
  }

  return response.json();
}

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = window.localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function logout() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({ message: "Login failed" }))) as { message?: string };
    throw new Error(payload.message ?? "Login failed");
  }

  const data = (await response.json()) as { token: string; user: unknown };
  window.localStorage.setItem(TOKEN_KEY, data.token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}

export async function requireSession() {
  const existingToken = window.localStorage.getItem(TOKEN_KEY);
  if (existingToken) {
    return existingToken;
  }

  throw new Error("Not authenticated");
}
