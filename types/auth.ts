export interface User {
  id?: number;
  username: string;
  role: "superadmin" | "admin" | "user";
}

export interface AuthResponse {
  status: "success";
  message?: string;
  user?: User;
}
