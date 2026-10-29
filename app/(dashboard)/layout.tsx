import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/Sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import Topbar from "@/components/layout/Topbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delay={0}>
      <SidebarProvider>
        <AppSidebar />
        {/* min-w-0: keng jadvallar sahifani emas, o'z konteynerini scroll qilsin */}
        <SidebarInset className="min-w-0">
          <Topbar />
          <main>{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
