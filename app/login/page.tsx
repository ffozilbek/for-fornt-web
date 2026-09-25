"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import * as z from "zod";
import { authService } from "@/service/auth.service";
import { useRouter } from "next/navigation";

const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Foydalanuvchi nomini kiriting")
    .regex(/^\S+$/, "Foydalanuvchi nomida probel bo'lmasligi kerak"),
  password: z
    .string()
    .min(8, "Parol kamida 8 ta belgidan iborat bo'lishi kerak"),
  // .regex(/^\S+$/, "Parolda probel bo'lmasligi kerak")
  // .regex(/[A-Z]/, "Kamida 1 ta katta harf bo'lishi kerak")
  // .regex(/[a-z]/, "Kamida 1 ta kichik harf bo'lishi kerak")
  // .regex(/[0-9]/, "Kamida 1 ta raqam bo'lishi kerak")
  // .regex(/[^A-Za-z0-9]/, "Kamida 1 ta maxsus belgi bo'lishi kerak"),
});

type FormFields = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    try {
      await authService.login(data.username, data.password);
      router.replace("/");
      router.refresh();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError("root", {
        message: err.message || "Foydalanuvchi nomi yoki parol noto'g'ri.",
      });
    }
  };

  const togglePasswordVisibility = () => {
    setVisible(!visible);
  };

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <Card className="max-w-120 w-full py-8">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Anti DDOS himoya tizimi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              {errors.root && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2.5 text-center text-xs text-destructive">
                  {errors.root.message}
                </div>
              )}
              <Field>
                <FieldLabel>Username</FieldLabel>
                <Input
                  {...register("username")}
                  type="text"
                  placeholder="John Smith"
                  autoComplete="off"
                  aria-invalid={!!errors.username}
                />
                <FieldError errors={[errors.username]} />
              </Field>
              <Field>
                <FieldLabel>Password</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    {...register("password")}
                    type={visible ? "text" : "password"}
                    placeholder="********"
                    autoComplete="off"
                    aria-invalid={!!errors.password}
                  />

                  <InputGroupAddon align="inline-end">
                    <Button
                      onClick={togglePasswordVisibility}
                      variant="ghost"
                      type="button"
                      className="hover:bg-white"
                    >
                      {visible ? <Eye /> : <EyeOff />}
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
                <FieldError errors={[errors.password]} />
              </Field>

              <Button type="submit" className="h-10" disabled={isSubmitting}>
                {isSubmitting ? "Loading..." : "Submit"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
