"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CustomSkeleton from "@/components/shared/CustomSkeleton";
import ListPagination, {
  DEFAULT_PAGE_SIZE,
} from "@/components/shared/ListPagination";
import RoleBadge from "@/components/account/RoleBadge";
import UserDialog from "@/components/account/UserDialog";
import { useDeleteUser, useUsers } from "@/hooks/useUsers";
import { formatDateTime } from "@/lib/format";
import type { AppUser } from "@/types/auth";

// foydalanuvchilar ro'yxati, qo'shish / tahrirlash / o'chirish (faqat superadmin).
// Superadmin qatorini tahrirlab ham, o'chirib ham bo'lmaydi
export default function UsersCard() {
  const { t } = useTranslation();
  const users = useUsers(true);
  const deleteUser = useDeleteUser();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [dialog, setDialog] = useState<AppUser | "new" | null>(null);
  const [toDelete, setToDelete] = useState<AppUser | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    error?: boolean;
  } | null>(null);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), message.error ? 4500 : 3500);
    return () => clearTimeout(id);
  }, [message]);
  const errText = (e: Error) =>
    e.message.startsWith("http.")
      ? t("misc.noConnectionWithServer")
      : e.message;

  const rows = users.data ?? [];
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;

  const confirmDelete = () => {
    if (!toDelete) return;
    const name = toDelete.username;
    deleteUser.mutate(name, {
      onSuccess: () => setMessage({ text: t("account.userDeleted", { name }) }),
      onError: (e) => setMessage({ text: errText(e), error: true }),
      onSettled: () => setToDelete(null),
    });
  };

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="bg-sidebar-accent-foreground text-sidebar-accent flex h-8 w-8 items-center justify-center rounded-md">
            <Users size={20} />
          </div>
          {t("navigation.usersList")}
        </CardTitle>
        <CardAction>
          <Button onClick={() => setDialog("new")}>
            <Plus />
            {t("account.add")}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-5">
        {message && (
          <Alert variant={message.error ? "destructive" : "default"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
        {users.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{errText(users.error)}</AlertDescription>
          </Alert>
        ) : users.isPending ? (
          <CustomSkeleton />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>№</TableHead>
                  <TableHead>{t("auth.username")}</TableHead>
                  <TableHead>{t("misc.role")}</TableHead>
                  <TableHead>{t("misc.createdAt")}</TableHead>
                  <TableHead>{t("misc.updatedAt")}</TableHead>
                  <TableHead className="text-right">
                    {t("misc.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-muted-foreground py-6 text-center"
                    >
                      {t("navigation.noUsers")}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.slice(start, start + pageSize).map((u, i) => (
                    <TableRow key={u.username}>
                      <TableCell className="font-medium">
                        {start + i + 1}
                      </TableCell>
                      <TableCell className="font-semibold">
{u.username}
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={u.role} />
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
{formatDateTime(u.created_at)}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
{u.updated_at && u.updated_at !== u.created_at
                          ? formatDateTime(u.updated_at)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {u.role === "superadmin" ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="icon-sm"
                              title={t("misc.edit")}
                              onClick={() => setDialog(u)}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              title={t("misc.delete")}
                              onClick={() => setToDelete(u)}
                            >
                              <Trash2 className="text-destructive" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {rows.length > 0 && (
              <ListPagination
                page={current}
                pageSize={pageSize}
                total={rows.length}
                onPage={setPage}
                onPageSize={(n) => {
                  setPageSize(n);
                  setPage(1);
                }}
              />
            )}
          </>
        )}
      </CardContent>

      <UserDialog
        target={dialog}
        onClose={() => setDialog(null)}
        onSaved={(text) => setMessage({ text })}
      />

      <AlertDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("account.deleteUserTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("account.deleteUserDesc", { name: toDelete?.username ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("misc.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteUser.isPending}
              onClick={confirmDelete}
            >
              {t("misc.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
