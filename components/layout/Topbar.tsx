"use client";
import CurrentTime from "../shared/CurrentTime";
import { DynamicBreadcrumb } from "../shared/DynamicBreadcrumb";
import LanguageToggler from "../shared/LanguageToggle";
import ModeToggler from "../shared/ModeToggler";
import { Separator } from "../ui/separator";
import { SidebarTrigger } from "../ui/sidebar";

export default function Topbar() {
  return (
    <header className="flex justify-between h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-sidebar border-b px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-8"
        />
        <DynamicBreadcrumb />
      </div>
      <div className="flex items-center gap-2">
        <div className="mr-5">
          <CurrentTime />
        </div>
        <LanguageToggler />
        <ModeToggler />
      </div>
    </header>
  );
}
