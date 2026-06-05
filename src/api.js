const ACCESS_STORAGE = "ihs-access-key";
const CLIENT_STORAGE = "ihs-client-id";

export function getStoredAccessKey() {
  try {
    return sessionStorage.getItem(ACCESS_STORAGE) || "";
  } catch {
    return "";
  }
}

export function setStoredAccessKey(key) {
  try {
    if (key) sessionStorage.setItem(ACCESS_STORAGE, key);
    else sessionStorage.removeItem(ACCESS_STORAGE);
  } catch {}
}

export function getClientId() {
  try {
    let id = localStorage.getItem(CLIENT_STORAGE);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(CLIENT_STORAGE, id);
    }
    return id;
  } catch {
    return "anonymous-client";
  }
}

export async function fetchAuthConfig() {
  const res = await fetch("/api/auth-config");
  if (!res.ok) return { required: false };
  return res.json();
}

export async function apiFetch(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  const key = getStoredAccessKey();
  if (key) headers["x-access-key"] = key;
  return fetch(url, { ...options, headers });
}

export async function fetchConversations() {
  const clientId = getClientId();
  const res = await apiFetch(`/api/conversations?clientId=${encodeURIComponent(clientId)}`);
  if (!res.ok) throw new Error("Failed to load chat history");
  const data = await res.json();
  return data.conversations || [];
}

export async function fetchConversation(id) {
  const clientId = getClientId();
  const res = await apiFetch(
    `/api/conversations/${encodeURIComponent(id)}?clientId=${encodeURIComponent(clientId)}`
  );
  if (!res.ok) throw new Error("Failed to load conversation");
  return res.json();
}

export async function deleteConversation(id) {
  const clientId = getClientId();
  const res = await apiFetch(
    `/api/conversations/${encodeURIComponent(id)}?clientId=${encodeURIComponent(clientId)}`,
    { method: "DELETE" }
  );
  if (!res.ok) throw new Error("Failed to delete conversation");
}
