import DetailView from "@/components/dashboard/(attack-section)/DetailView";
import {
  DETAIL_KINDS,
  SUMMARY_KEYS,
  type DetailKind,
  type DetailTarget,
  type SummaryKey,
} from "@/types/dashboard";
import { notFound } from "next/navigation";

export default async function DetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string; key: string }>;
  searchParams: Promise<{ hours?: string }>;
}) {
  const { kind, key } = await params;
  const { hours } = await searchParams;
  const hoursNum = Number(hours) > 0 ? Number(hours) : 1;
  const decodedKey = decodeURIComponent(key);

  if (!DETAIL_KINDS.includes(kind as DetailKind)) notFound();

  let target: DetailTarget;
  if (kind === "summary") {
    if (!SUMMARY_KEYS.includes(decodedKey as SummaryKey)) notFound();
    target = { kind: "summary", key: decodedKey as SummaryKey };
  } else {
    target = { kind: kind as Exclude<DetailKind, "summary">, key: decodedKey };
  }

  return (
    <div className="my-container flex flex-col gap-5 py-10">
      <DetailView target={target} hours={hoursNum} />
    </div>
  );
}
