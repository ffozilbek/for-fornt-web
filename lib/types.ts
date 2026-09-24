export interface User {
  username: string;
  role: "superadmin" | "admin" | "user";
}

export interface AuthResponse {
  status: "success";
  message?: string;
  user?: User;
}

export interface SystemResources {
  cpu_percent: number;
  memory_percent: number;
  memory_used_mb: number;
  memory_total_mb: number;
  disk_percent: number;
  disk_used_gb: number;
  disk_total_gb: number;
  uptime_seconds?: number;
}
