"use client";

import React from "react";
import { Search, RefreshCcw, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useSidebar } from "./sidebar-context";

interface TopbarProps {
  title: string;
  subtitle: string;
  showSearch?: boolean;
}

export function Topbar({ title, subtitle, showSearch = false }: TopbarProps) {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <header className="h-[72px] rounded-2xl lg:rounded-3xl border border-border/70 dark:border-white/[0.08] flex items-center justify-between px-6 bg-card/85 dark:bg-card/75 backdrop-blur-2xl shrink-0 shadow-lg shadow-black/5 dark:shadow-black/20 transition-all">
      {/* Left side: Apple iOS/macOS Functional Toggle + Premium Stacked Title & Subtitle */}
      <div className="flex items-center gap-4 min-w-0">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          className="h-9 w-9 rounded-xl border-border/70 bg-background/60 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 cursor-pointer transition-all shadow-2xs"
          title={isCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </Button>

        <div className="h-7 w-px bg-border/60 shrink-0" />

        <div className="flex flex-col justify-center min-w-0">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground truncate leading-none">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs lg:text-sm text-muted-foreground font-medium truncate mt-1.5 leading-none">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right side: Only Functional Tools (Search, Refresh & Theme Toggle) */}
      <div className="flex items-center gap-2.5 shrink-0">
        {showSearch && (
          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search leads, campaigns..."
                className="w-[260px] lg:w-[320px] h-9 pl-9 pr-14 bg-background/50 hover:bg-background border-border/70 focus-visible:ring-1 focus-visible:bg-background text-sm rounded-xl transition-all"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-card text-muted-foreground border border-border/80 pointer-events-none">
                ⌘K
              </kbd>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-xl border-border/70 bg-background/60 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer shadow-2xs"
              title="Refresh Data"
            >
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        )}

        <ThemeToggle />
      </div>
    </header>
  );
}
