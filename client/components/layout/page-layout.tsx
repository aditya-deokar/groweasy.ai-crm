import React from "react";
import { Topbar } from "./topbar";

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  showSearch?: boolean;
}

export function PageLayout({ children, title, subtitle, showSearch = false }: PageLayoutProps) {
  return (
    <div className="flex flex-col flex-1 h-full min-w-0 gap-3 lg:gap-4 overflow-hidden">
      <Topbar title={title} subtitle={subtitle} showSearch={showSearch} />
      <main className="flex-1 overflow-y-auto min-w-0 w-full pb-6">
        {children}
      </main>
    </div>
  );
}
