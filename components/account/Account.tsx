"use client";

import { useTranslation } from "react-i18next";
import { UserCog } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CustomSkeleton from "@/components/shared/CustomSkeleton";
import AvatarPicker from "@/components/account/AvatarPicker";
import ChangePasswordCard from "@/components/account/ChangePasswordCard";
import RoleBadge from "@/components/account/RoleBadge";
import UsersCard from "@/components/account/UsersCard";
import { useMe } from "@/hooks/useAuth";

// umumiy akkaunt sahifasi: profil, parolni o'zgartirish va (superadmin uchun)
// foydalanuvchilar boshqaruvi
export default function Account() {
  const { t } = useTranslation();
  const me = useMe();

  if (me.isPending) return <CustomSkeleton />;
  const user = me.data;
  const superadmin = user?.role === "superadmin";

  return (
    <div className="grid grid-cols-2 gap-5">
      <Card className="grid-cols-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="bg-sidebar-accent-foreground text-sidebar-accent flex h-8 w-8 items-center justify-center rounded-md">
              <UserCog size={20} />
            </div>
            <span>{t("account.account")}</span>
          </CardTitle>
          <CardDescription>{t("account.accountDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1">
            <span className="font-semibold">{user?.username ?? "—"}</span>
            {user && <RoleBadge role={user.role} />}
          </div>
          {user && <AvatarPicker username={user.username} />}
        </CardContent>
      </Card>

      <ChangePasswordCard canChange={superadmin} />
      {superadmin && <UsersCard />}
    </div>
  );
}
