import { z } from "zod";

export const ROLES = ["superadmin", "admin", "user"] as const;
export type Role = (typeof ROLES)[number];

// GET /api/auth/me — {status, username, role} (user obyekti ichida emas)
export const meResponseSchema = z.object({
  username: z.string(),
  role: z.enum(ROLES).catch("user"),
});

export type User = z.infer<typeof meResponseSchema>;

export interface AuthResponse {
  status: "success";
  message?: string;
  user?: User;
}

// GET /api/users — faqat superadmin
export const appUserSchema = z.object({
  username: z.string(),
  role: z.enum(ROLES).catch("user"),
  created_at: z.string().catch(""),
  updated_at: z.string().catch(""),
});

export const usersResponseSchema = z.object({
  users: z.array(appUserSchema),
});

export type AppUser = z.infer<typeof appUserSchema>;

// POST /api/users (yangi) yoki PUT /api/users/<orig> (tahrir; bo'sh parol — o'zgarmaydi)
export type UserSavePayload = {
  original?: string;
  username: string;
  password: string;
  role: Exclude<Role, "superadmin">;
};

export type ChangePasswordPayload = {
  old_password: string;
  new_password: string;
  new_password2: string;
};
