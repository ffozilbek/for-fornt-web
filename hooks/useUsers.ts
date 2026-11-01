import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { usersService } from "@/service/users.service";

export const useUsers = (enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.users,
    queryFn: usersService.list,
    enabled,
  });

const useUsersMutation = <T, R>(fn: (v: T) => Promise<R>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users }),
  });
};

export const useSaveUser = () => useUsersMutation(usersService.save);
export const useDeleteUser = () => useUsersMutation(usersService.remove);
