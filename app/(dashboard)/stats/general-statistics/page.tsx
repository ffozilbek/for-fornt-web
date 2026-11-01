import GeneralStatistics from "@/components/statistics/GeneralStatistics";

// ?zone=<nom> — zona jadvali amallaridan kelinganda boshlang'ich zona filtri
export default async function GeneralStatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ zone?: string }>;
}) {
  const { zone } = await searchParams;
  return (
    <div className="my-container flex flex-col gap-5 py-10">
      <GeneralStatistics zone={zone} />
    </div>
  );
}
