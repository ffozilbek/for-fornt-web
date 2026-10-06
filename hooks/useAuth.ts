import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/service/auth.service";
import { queryKeys } from "@/lib/query-keys";

export const useMe = () =>
  useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: authService.getCurrentUser,
    select: (res) => res.user,
    retry: false,
    staleTime: 5 * 60_000,
  });

export const useLogin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { username: string; password: string }) =>
      authService.login(v.username, v.password),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.auth.me }),
  });
};

export const useLogout = () => {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      qc.clear();
      router.replace("/login");
    },
  });
};
