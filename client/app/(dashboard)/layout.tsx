import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout 
      title="CSV Lead Import"
      subtitle="Preview, process, and review AI-normalized CRM records with live backend status."
    >
      {children}
    </DashboardLayout>
  );
}
