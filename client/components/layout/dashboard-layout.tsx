"use client";

import React from "react";
import { Sidebar } from "./sidebar";
import { SidebarProvider } from "./sidebar-context";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-muted/50 dark:bg-[#0b0c0e] p-3 lg:p-4 gap-3 lg:gap-4 overflow-hidden font-sans text-foreground">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
