import { Search, RefreshCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface TopbarProps {
  title: string;
  subtitle: string;
  showSearch?: boolean;
}

export function Topbar({ title, subtitle, showSearch = false }: TopbarProps) {
  return (
    <header className="h-[100px] border-b flex items-center justify-between px-8 bg-background shrink-0">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-foreground mb-1">{title}</h1>
        <p className="text-sm text-muted-foreground font-medium">{subtitle}</p>
      </div>

      <div className="flex items-center space-x-3">
        {showSearch && (
          <>
            <div className="relative">
              <Input
                type="text"
                placeholder="Enter email or phone number..."
                className="w-[300px] bg-muted border-border focus-visible:ring-1 pr-10 text-foreground"
              />
              <Button
                size="icon"
                className="absolute right-0 top-0 rounded-l-none bg-[#0D652D] hover:bg-[#0A4D22] text-white h-full"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" size="icon" className="border-border text-muted-foreground hover:bg-muted">
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
