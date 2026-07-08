import { Topbar } from "./topbar";

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  showSearch?: boolean;
}

export function PageLayout({ children, title, subtitle, showSearch = false }: PageLayoutProps) {
  return (
    <>
      <Topbar title={title} subtitle={subtitle} showSearch={showSearch} />
      <main className="flex-1 overflow-y-auto p-8 bg-muted/20">
        {children}
      </main>
    </>
  );
}
