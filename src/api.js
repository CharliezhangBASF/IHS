const STORAGE = "ihs-access-key";

export function getStoredAccessKey() {
  try {
    return sessionStorage.getItem(STORAGE) || "";
  } catch {
    return "";
  }
}

export function setStoredAccessKey(key) {
  try {
    if (key) sessionStorage.setItem(STORAGE, key);
    else sessionStorage.removeItem(STORAGE);
  } catch {}
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
