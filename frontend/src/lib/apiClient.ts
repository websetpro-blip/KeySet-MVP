const envBase = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
const normalizedEnv = envBase.endsWith("/") ? envBase.slice(0, -1) : envBase;

const runtimeBase =
  typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : "";

export const API_BASE_URL = normalizedEnv || runtimeBase || "";

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

export function apiUrl(path: string): string {
  const normalizedPath = normalizePath(path);
  if (!API_BASE_URL) {
    return normalizedPath;
  }
  return `${API_BASE_URL}${normalizedPath}`;
}
