import IncidentLogs from "@/components/incidents/IncidentLogs";

// ?zone=<nom> — zona jadvali amallaridan kelinganda boshlang'ich zona filtri
export default async function IncidentLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ zone?: string }>;
}) {
  const { zone } = await searchParams;
  return (
    <div className="my-container flex flex-col gap-5 py-10">
      <IncidentLogs zone={zone} />
    </div>
  );
}
