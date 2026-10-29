import HttpsFloodHistory from "@/components/https-protection/HttpsFloodHistory";
import HttpsFloodStatus from "@/components/https-protection/HttpsFloodStatus";

export default function HttpsProtection() {
  return (
    <div className="my-container flex flex-col gap-5 py-10">
      <HttpsFloodStatus />
      <HttpsFloodHistory />
    </div>
  );
}
