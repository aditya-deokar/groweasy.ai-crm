"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Rocket,
  Database,
  MessageSquare,
  Users,
  Megaphone,
  UserPlus,
  MessageCircle,
  PhoneCall,
  LayoutList,
  Wifi,
  Briefcase,
  ChevronRight,
  History,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";

const mainNavItems = [
  { title: "Dashboard", href: "#", icon: LayoutDashboard },
  { title: "Generate Leads", href: "#", icon: Rocket },
  { title: "Manage Leads", href: "/leads", icon: Database },
  { title: "Engage Leads", href: "#", icon: MessageSquare },
];

const controlCenterItems = [
  { title: "Team Members", href: "#", icon: Users },
  { title: "Lead Sources", href: "/import", icon: Megaphone },
  { title: "Import History", href: "/import/history", icon: History },
  { title: "Ad Accounts", href: "#", icon: UserPlus },
  { title: "WhatsApp Account", href: "#", icon: MessageCircle },
  { title: "Tele Calling", href: "#", icon: PhoneCall },
  { title: "CRM Fields", href: "#", icon: LayoutList },
  { title: "API Center", href: "#", icon: Wifi },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const isActive = (href: string) => {
    if (href === "#") return false;
    if (href === "/import" && pathname.startsWith("/import/history")) return false;
    return pathname === href || pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full rounded-2xl lg:rounded-3xl border border-border/70 dark:border-white/[0.08] bg-card/85 dark:bg-card/75 backdrop-blur-2xl text-foreground shadow-lg shadow-black/5 dark:shadow-black/20 transition-all duration-300 ease-in-out select-none z-30 overflow-hidden shrink-0",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          "flex items-center h-[72px] border-b border-border/50 px-4 transition-all duration-300",
          isCollapsed ? "justify-center" : "justify-between pl-5 pr-4"
        )}
      >
        <Link href="/import" className="flex items-center gap-3 group overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0D652D] via-[#13883E] to-[#15803d] flex items-center justify-center shadow-md shadow-emerald-950/15 text-white shrink-0 group-hover:scale-105 transition-transform duration-200">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden transition-opacity duration-300">
              <span className="text-lg font-bold tracking-tight text-foreground whitespace-nowrap">
                GrowEasy
              </span>
              <span className="text-[10px] font-semibold tracking-widest px-1.5 py-0.5 rounded-full bg-[#E6F4EA] text-[#0D652D] dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-500/20 uppercase shrink-0">
                CRM
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Workspace Profile Selector */}
      <div className="p-3 border-b border-border/40">
        <div
          className={cn(
            "flex items-center rounded-xl border border-border/60 bg-gradient-to-b from-card to-muted/40 hover:bg-muted/60 transition-all duration-200 cursor-pointer shadow-2xs group",
            isCollapsed ? "justify-center p-2" : "justify-between p-2.5"
          )}
          title={isCollapsed ? "VK Test — OWNER" : undefined}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                VK
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold leading-none text-foreground truncate mb-1">
                  VK Test
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
                  Owner
                </span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-6">
        {/* Main Section */}
        <div>
          {!isCollapsed ? (
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-widest">
                Main
              </span>
            </div>
          ) : (
            <div className="h-px bg-border/60 mx-2 mb-3" />
          )}
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const active = isActive(item.href);
              return (
                <div
                  key={item.title}
                  className="relative"
                  onMouseEnter={() => isCollapsed && setHoveredItem(item.title)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-foreground/7 dark:bg-white/[0.08] text-foreground font-medium"
                        : "text-muted-foreground hover:bg-foreground/4 dark:hover:bg-white/[0.04] hover:text-foreground",
                      isCollapsed && "justify-center px-0"
                    )}
                  >
                    {active && (
                      <span className="absolute left-1 w-0.5 h-4 bg-emerald-500 rounded-full" />
                    )}
                    <item.icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        active
                          ? "text-foreground"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {!isCollapsed && (
                      <span className="truncate">{item.title}</span>
                    )}
                  </Link>

                  {/* Floating Tooltip in Collapsed state */}
                  {isCollapsed && hoveredItem === item.title && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-lg bg-popover text-popover-foreground text-xs font-medium shadow-lg border border-border whitespace-nowrap z-50 pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150">
                      {item.title}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Control Center Section */}
        <div>
          {!isCollapsed ? (
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-widest">
                Control Center
              </span>
            </div>
          ) : (
            <div className="h-px bg-border/60 mx-2 mb-3" />
          )}
          <nav className="space-y-1">
            {controlCenterItems.map((item) => {
              const active = isActive(item.href);
              return (
                <div
                  key={item.title}
                  className="relative"
                  onMouseEnter={() => isCollapsed && setHoveredItem(item.title)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-foreground/7 dark:bg-white/[0.08] text-foreground font-medium"
                        : "text-muted-foreground hover:bg-foreground/4 dark:hover:bg-white/[0.04] hover:text-foreground",
                      isCollapsed && "justify-center px-0"
                    )}
                  >
                    {active && (
                      <span className="absolute left-1 w-0.5 h-4 bg-emerald-500 rounded-full" />
                    )}
                    <item.icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        active
                          ? "text-foreground"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {!isCollapsed && (
                      <span className="truncate">{item.title}</span>
                    )}
                  </Link>

                  {/* Floating Tooltip in Collapsed state */}
                  {isCollapsed && hoveredItem === item.title && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-lg bg-popover text-popover-foreground text-xs font-medium shadow-lg border border-border whitespace-nowrap z-50 pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150">
                      {item.title}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Section */}
      <div className="p-3 border-t border-border/50 space-y-1 mt-auto">
        {/* Business Center Link */}
        <div
          className="relative"
          onMouseEnter={() => isCollapsed && setHoveredItem("Business Center")}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <Link
            href="#"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all duration-150",
              isCollapsed && "justify-center px-0"
            )}
          >
            <Briefcase className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Business Center</span>}
          </Link>
          {isCollapsed && hoveredItem === "Business Center" && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 rounded-lg bg-popover text-popover-foreground text-xs font-medium shadow-lg border border-border whitespace-nowrap z-50 pointer-events-none">
              Business Center
            </div>
          )}
        </div>

        {/* Collapse / Expand Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all duration-150 cursor-pointer",
            isCollapsed ? "justify-center px-0" : "justify-between"
          )}
          title={isCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
        >
          <div className="flex items-center gap-3">
            {isCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 shrink-0" />
            ) : (
              <PanelLeftClose className="w-5 h-5 shrink-0" />
            )}
            {!isCollapsed && <span>Collapse Sidebar</span>}
          </div>
          {!isCollapsed && (
            <kbd className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/80">
              Ctrl+B
            </kbd>
          )}
        </button>
      </div>
    </aside>
  );
}
