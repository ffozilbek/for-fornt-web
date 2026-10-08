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
  (error: AxiosError<{ message?: string; error?: string }>) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    const status = error.response?.status;
    const isLogin = error.config?.url?.includes("/api/auth/login");
    if (status === 401 && !isLogin && typeof window !== "undefined") {
      window.location.replace("/login");
    }
    const msg = error.response?.data?.message ?? error.response?.data?.error;
    return Promise.reject(
      new ApiError(msg ?? `http.${status ?? "network"}`, status),
    );
  },
);
