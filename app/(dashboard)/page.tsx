import AttackStatistics from "@/components/dashboard/(attack-section)/AttackStatistics";
import DashboardSelects from "@/components/dashboard/DashboardSelects";
import SystemResources from "@/components/dashboard/SystemResources";

export default function Dashboard() {
  return (
    <div className="my-container flex flex-col gap-5 py-10">
      <DashboardSelects />
      <AttackStatistics />
      <SystemResources />
    </div>
  );
}
