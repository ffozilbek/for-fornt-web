import AttackStatistics from "@/components/dashboard/(attack-section)/AttackStatistics";
import SystemResources from "@/components/dashboard/SystemResources";

export default function Dashboard() {
  return (
    <div className="my-container flex flex-col gap-5 py-10">
      <AttackStatistics />
      <SystemResources />
    </div>
  );
}
