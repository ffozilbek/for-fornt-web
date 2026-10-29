"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Activity,
  BarChart3,
  Copy,
  Layers3,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CustomSkeleton from "@/components/shared/CustomSkeleton";
import EmptySheet from "@/components/shared/EmptySheet";
import Truncated from "@/components/shared/Truncated";
import { useZones } from "@/hooks/useDashboard";
import { useDeleteZone, useZonesServices } from "@/hooks/useZones";
import { usePersistedState } from "@/hooks/usePersistedState";
import { formatDateTime } from "@/lib/format";
import { Service, Zone } from "@/types/dashboard";
import ZoneForDialog, { displayIp, ZoneDialogMode } from "./ZoneForDialog";

const PAGE_SIZE = 10;
const MAX_IPS_SHOWN = 2;
const MAX_SERVICES_SHOWN = 3;

// bu protokollar uchun port ko'rsatilmaydi
const NO_PORT_PROTOCOLS = ["ICMP", "Any TCP", "Any UDP", "Other", "All"];

const serviceLabel = (s: Service) => {
  if (s.protocol === "PROTO_NUMBER") return `Proto #${s.protocolNumber}`;
  if (NO_PORT_PROTOCOLS.includes(s.protocol) || !s.ports) return s.protocol;
  return `${s.protocol} ${s.ports}`;
};

type DialogState = { mode: ZoneDialogMode; zone?: Zone } | null;

export default function ZoneTable() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: zones, isPending, isError, error, refetch, isFetching } =
    useZones();
  const servicesByZone = useZonesServices(
    useMemo(() => (zones ?? []).map((z) => z.zoneName), [zones]),
  );
  const deleteZone = useDeleteZone();
  const [, setDashboardZone] = usePersistedState("dashboard.zone", "all");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [toDelete, setToDelete] = useState<Zone | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    error?: boolean;
  } | null>(null);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), message.error ? 4500 : 3500);
    return () => clearTimeout(id);
  }, [message]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!zones || !q) return zones ?? [];
    return zones.filter(
      (z) =>
        z.zoneName.toLowerCase().includes(q) ||
        z.ips.some((ip) => ip.toLowerCase().includes(q)),
    );
  }, [zones, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  const onSaved = (mode: ZoneDialogMode) =>
    setMessage({
      text:
        mode === "edit" ? t("navigation.zoneUpdated") : t("navigation.zoneAdded"),
    });

  const confirmDelete = () => {
    if (!toDelete) return;
    deleteZone.mutate(toDelete.zoneName, {
      onSuccess: () => setMessage({ text: t("navigation.zoneDeleted") }),
      onError: (err) =>
        setMessage({
          error: true,
          text: err.message.startsWith("http.")
            ? t("misc.noConnectionWithServer")
            : err.message,
        }),
      onSettled: () => setToDelete(null),
    });
  };

  const openRealtime = (zone: Zone) => {
    setDashboardZone(zone.zoneName);
    router.push("/");
  };

  if (isPending) return <CustomSkeleton />;
  if (isError)
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {t("navigation.errorLoadingZones")} {error.message}
        </AlertDescription>
      </Alert>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="bg-sidebar-accent-foreground text-sidebar-accent h-8 w-8 rounded-md flex items-center justify-center">
            <Layers3 size={20} />
          </div>
          <span>{t("navigation.zoneManagement")}</span>
        </CardTitle>
        <CardDescription>{t("navigation.manageNetworkZones")}</CardDescription>
        <CardAction>
          <Button onClick={() => setDialog({ mode: "create" })}>
            <Plus />
            {t("navigation.addZone")}
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex items-center gap-2">
          <InputGroup className="max-w-sm">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t("navigation.searchByZoneNameOrIP")}
            />
          </InputGroup>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={isFetching ? "animate-spin" : ""} />
            {t("misc.refresh")}
          </Button>
        </div>

        {message && (
          <Alert variant={message.error ? "destructive" : "default"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {zones.length === 0 ? (
          <div className="py-10">
            <EmptySheet />
            <p className="text-center text-muted-foreground mt-2">
              {t("navigation.noZones")}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">
            {t("misc.nothingFoundForTheSearch")}
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("misc.name")}</TableHead>
                  <TableHead>{t("misc.iPSubnet")}</TableHead>
                  <TableHead>{t("misc.services")}</TableHead>
                  <TableHead>{t("misc.createdAt")}</TableHead>
                  <TableHead>{t("misc.updatedAt")}</TableHead>
                  <TableHead className="text-right">
                    {t("misc.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((zone) => {
                  const services = [
                    ...(servicesByZone[zone.zoneName] ?? []),
                  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
                  return (
                    <TableRow key={zone.zoneName}>
                      <TableCell>
                        <button
                          type="button"
                          className="cursor-pointer font-medium hover:underline"
                          onClick={() => setDialog({ mode: "edit", zone })}
                        >
                          {zone.zoneName}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Truncated
                          max={MAX_IPS_SHOWN}
                          items={zone.ips.map((ip) => (
                            <span key={ip} className="font-mono text-xs">
                              {displayIp(ip)}
                            </span>
                          ))}
                        />
                      </TableCell>
                      <TableCell>
                        <Truncated
                          max={MAX_SERVICES_SHOWN}
                          items={services.map((s) => (
                            <Badge key={s.serviceName} variant="secondary">
                              {serviceLabel(s)}
                            </Badge>
                          ))}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(zone.createDate)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(zone.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button variant="ghost" size="icon-sm" />}
                          >
                            <MoreVertical />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem
                              onClick={() => setDialog({ mode: "edit", zone })}
                            >
                              <Pencil />
                              {t("misc.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                setDialog({ mode: "duplicate", zone })
                              }
                            >
                              <Copy />
                              {t("misc.duplicate")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openRealtime(zone)}
                            >
                              <Activity />
                              {t("misc.realTimeStats")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/zone/${encodeURIComponent(zone.zoneName)}`,
                                )
                              }
                            >
                              <BarChart3 />
                              {t("misc.details")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setToDelete(zone)}
                            >
                              <Trash2 />
                              {t("misc.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  {start + 1}–{start + pageRows.length} / {filtered.length}
                </span>
                <Pagination className="mx-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        aria-disabled={currentPage === 1}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(Math.max(1, currentPage - 1));
                        }}
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        aria-disabled={currentPage === totalPages}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(Math.min(totalPages, currentPage + 1));
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>

      <ZoneForDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        mode={dialog?.mode ?? "create"}
        zone={dialog?.zone}
        onSaved={onSaved}
      />

      <AlertDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("misc.delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              <b>{toDelete?.zoneName}</b>{" "}
              {t("navigation.deleteThisZoneAllServicesInThisZoneWillA")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("misc.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteZone.isPending}
            >
              {t("misc.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
