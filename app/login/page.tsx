"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";

import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { authService } from "@/service/auth.service";
import { useEffect, useState } from "react";

// 1. Zod validatsiya sxemasi
const loginSchema = z.object({
  username: z.string().min(1, "Foydalanuvchi nomini kiriting."),
  password: z
    .string()
    .min(1, "Parolni kiriting")
    .min(8, "Parol kamida 8 ta belgidan iborat bo'lishi kerak")
    .regex(/[A-Z]/, "Kamida 1 ta katta harf bo'lishi kerak")
    .regex(/[a-z]/, "Kamida 1 ta kichik harf bo'lishi kerak")
    .regex(/[0-9]/, "Kamida 1 ta raqam bo'lishi kerak")
    .regex(/[^A-Za-z0-9]/, "Kamida 1 ta maxsus belgi bo'lishi kerak"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkExistingSession() {
      try {
        await authService.getCurrentUser();
        router.replace("/");
      } catch {
        setCheckingAuth(false);
      }
    }
    checkExistingSession();
  }, [router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // 2. Submit logikasi
  async function onSubmit(data: LoginFormValues) {
    try {
      await authService.login(data.username, data.password);
      router.replace("/");
      router.refresh();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      form.setError("root", {
        message: err.message || "Server bilan aloqa uzildi.",
      });
    }
  }

  const { isSubmitting } = form.formState;
  const rootError = form.formState.errors.root;

  return (
    <div className="h-screen flex items-center justify-center">
      <Card className="max-w-120 w-full py-8 px-3">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-xl font-bold tracking-tight">
            Anti-DDoS Himoya tizimi
          </CardTitle>
          <CardDescription className="text-xs">
            Boshqaruv paneliga kirish uchun hisob maʼlumotlarini kiriting
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Umumiy server xatoligi (root error) */}
            {rootError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2.5 text-center text-xs text-destructive">
                {rootError.message}
              </div>
            )}

            <FieldGroup className="space-y-3">
              {/* Username Field */}
              <Controller
                name="username"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Foydalanuvchi nomi
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      autoComplete="username"
                      placeholder="admin"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Password Field */}
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Parol</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Tekshirilmoqda..." : "Kirish"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
