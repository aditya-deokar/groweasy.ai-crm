import Link from "next/link";
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
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { title: "Dashboard", href: "#", icon: LayoutDashboard },
  { title: "Generate Leads", href: "#", icon: Rocket },
  { title: "Manage Leads", href: "#", icon: Database },
  { title: "Engage Leads", href: "#", icon: MessageSquare },
];

const controlCenterItems = [
  { title: "Team Members", href: "#", icon: Users },
  { title: "Lead Sources", href: "/import", icon: Megaphone, isActive: true },
  { title: "Ad Accounts", href: "#", icon: UserPlus },
  { title: "WhatsApp Account", href: "#", icon: MessageCircle },
  { title: "Tele Calling", href: "#", icon: PhoneCall },
  { title: "CRM Fields", href: "#", icon: LayoutList },
  { title: "API Center", href: "#", icon: Wifi },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-muted/30 flex flex-col h-screen shrink-0 overflow-y-auto">
      <div className="p-4 pl-6 pt-6 flex items-center space-x-2">
        <div className="w-8 h-8 bg-foreground rounded flex items-center justify-center">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="text-background"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">GrowEasy</span>
      </div>

      <div className="px-4 py-2">
        <div className="flex items-center justify-between p-2 rounded-lg border bg-card shadow-sm cursor-pointer hover:bg-muted">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
              VK
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-none mb-1 text-foreground">VK Test</span>
              <span className="text-[10px] font-medium text-muted-foreground tracking-wider">OWNER</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      <div className="flex-1 py-4 flex flex-col gap-6">
        <div className="px-4">
          <h4 className="text-xs font-bold text-muted-foreground mb-2 px-2 uppercase tracking-wider">Main</h4>
          <nav className="flex flex-col gap-1">
            {mainNavItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="flex items-center space-x-3 px-2 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-muted hover:text-foreground transition-colors"
              >
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="px-4">
          <h4 className="text-xs font-bold text-muted-foreground mb-2 px-2 uppercase tracking-wider">Control Center</h4>
          <nav className="flex flex-col gap-1">
            {controlCenterItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  item.isActive
                    ? "bg-[#E6F4EA] text-[#0D652D] dark:bg-green-900/30 dark:text-green-400"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn("w-5 h-5", item.isActive ? "text-[#0D652D] dark:text-green-400" : "text-muted-foreground")}
                />
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-4 mt-auto">
        <Link
          href="#"
          className="flex items-center space-x-3 px-2 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-muted hover:text-foreground transition-colors"
        >
          <Briefcase className="w-5 h-5 text-muted-foreground" />
          <span>Business Center</span>
        </Link>
      </div>
    </aside>
  );
}
