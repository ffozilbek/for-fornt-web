// components/app-sidebar.tsx
"use client";

import {
  LayoutDashboard,
  Layers3,
  Shield,
  ClipboardList,
  BarChart3,
  Zap,
  FileText,
  Users,
  ChevronRight,
  User2,
  ChevronsUpDown,
  KeySquare,
  LogOut,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

import Link from "next/link";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const navItems = [
  { title: "Dashbord", url: "/dashboard", icon: LayoutDashboard },
  { title: "Zona boshqarish", url: "/zones", icon: Layers3, isActive: true },
  {
    title: "Himoya shabloni",
    icon: Shield,
    items: [
      { title: "Shablonlar", url: "/protection/templates" },
      { title: "Yangi shablon", url: "/protection/new" },
    ],
  },
  {
    title: "Logs",
    icon: ClipboardList,
    badge: 3,
    items: [
      { title: "So'nggi loglar", url: "/logs/recent" },
      { title: "Arxiv", url: "/logs/archive" },
    ],
  },
  {
    title: "Statistika",
    icon: BarChart3,
    items: [
      { title: "Trafik", url: "/stats/traffic" },
      { title: "Hujumlar", url: "/stats/attacks" },
    ],
  },
  {
    title: "Ulanishlar",
    icon: Zap,
    items: [
      { title: "Faol ulanishlar", url: "/connections/active" },
      { title: "Tarix", url: "/connections/history" },
    ],
  },
  { title: "Pcap boshqaruvi", url: "/pcap", icon: FileText },
  { title: "Foydalanuvchilar", url: "/users", icon: Users },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                S
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">Sarhad</span>
                <span className="truncate text-xs text-muted-foreground">
                  Anti DDOS himoya tizimi{" "}
                  <Badge className="text-[10px]">v0.1</Badge>
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3">
        <SidebarMenu className="gap-1">
          {navItems.map((item) =>
            item.items ? (
              <Collapsible key={item.title} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger
                    render={
                      <SidebarMenuButton
                        tooltip={item.title}
                        className="cursor-pointer"
                      />
                    }
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                    {item.badge && (
                      <SidebarMenuBadge className="static flex size-5 items-center justify-center rounded-full bg-destructive p-0 text-[11px] font-semibold text-white group-data-[collapsible=icon]:hidden">
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                    <ChevronRight className="ml-auto size-4 shrink-0 text-sidebar-foreground/50 transition-transform group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((sub) => (
                        <SidebarMenuSubItem key={sub.title}>
                          <SidebarMenuSubButton render={<a href={sub.url} />}>
                            <span>{sub.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ) : (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={<a href={item.url} />}
                  tooltip={item.title}
                  isActive={item.isActive}
                  className="data-[active=true]:bg-sidebar-primary/15 data-[active=true]:text-sidebar-primary data-[active=true]:ring-1 data-[active=true]:ring-sidebar-primary/40"
                >
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ),
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-3 py-3 mb-10">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 overflow-hidden">
                      {/* <AvatarImage src={user.avatar} alt={user.name} /> */}
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">root</span>
                      <div className="flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-green-400" />
                        <span className="truncate text-xs">online</span>
                      </div>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                }
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
                  <User2 />
                </div>
                <div className="flex flex-col text-left group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-medium">root</span>
                  <span className="flex items-center gap-1 text-xs text-sidebar-foreground/60">
                    <span className="size-1.5 rounded-full bg-green-500" />
                    Onlayn
                  </span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-56">
                <DropdownMenuItem className="flex items-center justify-between">
                  <span>Parolni o`zgartirish</span>
                  <span>
                    <KeySquare />
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  className="flex items-center justify-between"
                >
                  <span>Chiqish</span>
                  <span>
                    <LogOut />
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
