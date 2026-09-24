// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class UnauthorizedError extends Error {
  constructor(message = "Sessiya muddati tugagan yoki ruxsat berilmagan") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new UnauthorizedError();
    }

    const errorData = await res.json().catch(() => null);
    const errorMessage =
      errorData?.message || `So'rovda xatolik yuz berdi: ${res.status}`;

    throw new Error(errorMessage);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}
