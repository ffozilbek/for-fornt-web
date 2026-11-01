import ProtectionStatistics from "@/components/protection-stats/ProtectionStatistics";

// ?zone=<nom> — zona jadvali amallaridan kelinganda boshlang'ich zona filtri
export default async function ProtectionStatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ zone?: string }>;
}) {
  const { zone } = await searchParams;
  return (
    <div className="my-container flex flex-col gap-5 py-10">
      <ProtectionStatistics zone={zone} />
    </div>
  );
}
