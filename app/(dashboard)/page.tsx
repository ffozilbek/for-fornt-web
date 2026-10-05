import AttackSummary from "@/components/dashboard/AttackSummary";
import SystemResources from "@/components/dashboard/SystemResources";

export default function Dashboard() {
  return (
    <div className="my-container flex flex-col gap-5 py-10">
      <AttackSummary />
      <SystemResources />
    </div>
  );
}
