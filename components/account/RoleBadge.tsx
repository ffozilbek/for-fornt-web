import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/auth";

const CLS: Record<Role, string> = {
  superadmin: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
  admin: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  user: "bg-muted text-muted-foreground",
};

export default function RoleBadge({ role }: { role: Role }) {
  return <Badge className={cn("capitalize", CLS[role])}>{role}</Badge>;
}
