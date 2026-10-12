import SummaryDetailView from "@/components/dashboard/(attack-section)/SummaryDetailView";
import { SUMMARY_KEYS, SummaryKey } from "@/types/dashboard";
import { notFound } from "next/navigation";

export default async function SummaryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<{ hours?: string }>;
}) {
  const { key } = await params;
  const { hours } = await searchParams;

  if (!SUMMARY_KEYS.includes(key as SummaryKey)) {
    notFound();
  }

  const hoursNum = Number(hours) > 0 ? Number(hours) : 1;

  return (
    <div className="my-container flex flex-col gap-5 py-10">
      <SummaryDetailView summaryKey={key as SummaryKey} hours={hoursNum} />
    </div>
  );
}
