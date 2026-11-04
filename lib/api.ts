import axios, { AxiosError } from "axios";

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

export const api = axios.create({
  baseURL: "",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ message?: string; error?: string; msg?: string }>) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    const status = error.response?.status;
    const isLogin = error.config?.url?.includes("/api/auth/login");
    if (status === 401 && !isLogin && typeof window !== "undefined") {
      window.location.replace("/login");
    }
    // pcap / flowlog endpointlari xatoni `msg` kalitida qaytaradi
    const data = error.response?.data;
    const msg = data?.message ?? data?.error ?? data?.msg;
    return Promise.reject(
      new ApiError(msg ?? `http.${status ?? "network"}`, status),
    );
  },
);
