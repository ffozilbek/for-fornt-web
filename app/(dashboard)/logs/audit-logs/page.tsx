import AuditLogs from "@/components/audit-logs/AuditLogs";

// ?zone=<nom> — zona jadvali amallaridan kelinganda boshlang'ich zona filtri
export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ zone?: string }>;
}) {
  const { zone } = await searchParams;
  return (
    <div className="my-container flex flex-col gap-5 py-10">
      <AuditLogs zone={zone} />
    </div>
  );
}
