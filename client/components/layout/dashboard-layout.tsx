import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  showSearch?: boolean;
}

export function DashboardLayout({
  children,
  title,
  subtitle,
  showSearch = false,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar title={title} subtitle={subtitle} showSearch={showSearch} />
        <main className="flex-1 overflow-y-auto p-8 bg-muted/20">
          {children}
        </main>
      </div>
    </div>
  );
}
