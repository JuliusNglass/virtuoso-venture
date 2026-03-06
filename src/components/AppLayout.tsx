import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, BookOpen, Calendar, Music,
  FileText, UserPlus, LogOut, Bell, MessageCircle,
  Sun, CreditCard, Settings2, GraduationCap, Users2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStudio } from "@/hooks/useStudio";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navItems = [
  { path: "/today",      label: "Today",           icon: Sun },
  { path: "/dashboard",  label: "Dashboard",       icon: LayoutDashboard },
  { path: "/students",   label: "Students",        icon: Users },
  { path: "/lessons",    label: "Lessons",         icon: BookOpen },
  { path: "/classes",    label: "Classes",         icon: GraduationCap },
  { path: "/calendar",   label: "Calendar",        icon: Calendar },
  { path: "/messages",   label: "Messages",        icon: MessageCircle, badgeKey: "messages" },
  { path: "/repertoire", label: "Music Library",   icon: Music },
  { path: "/files",      label: "Files & Scores",  icon: FileText },
  { path: "/requests",   label: "Applications",    icon: UserPlus },
  { path: "/payments",   label: "Payments",        icon: CreditCard },
  { path: "/signups",    label: "Signups",         icon: Users2 },
  { path: "/settings",   label: "Settings",        icon: Settings2 },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { studio } = useStudio();
  const { setOpen, setOpenMobile, isMobile } = useSidebar();

  const closeSidebar = () => isMobile ? setOpenMobile(false) : setOpen(false);

  // Unread messages count (messages not sent by the current teacher)
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-messages", studio?.id],
    queryFn: async () => {
      if (!studio?.id || !user?.id) return 0;
      // Count threads that have at least one message from a parent (not from this user)
      const { data: threads } = await supabase
        .from("message_threads")
        .select("id")
        .eq("studio_id", studio.id);
      if (!threads?.length) return 0;
      const threadIds = threads.map(t => t.id);
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("thread_id", threadIds)
        .neq("sender_user_id", user.id)
        // Only count messages from last 7 days as "unread indicators"
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      return count ?? 0;
    },
    enabled: !!studio?.id && !!user?.id,
    refetchInterval: 30_000, // poll every 30s
  });

  const initials = studio?.name
    ? studio.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "C";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
      {/* Header */}
      <SidebarHeader className="px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold shrink-0">
            <span className="text-charcoal font-bold text-sm">🎵</span>
          </div>
          <span className="font-heading font-bold text-sidebar-foreground text-base truncate">
            {studio?.name ?? "Conservo"}
          </span>
        </div>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="px-3 py-3">
        <SidebarMenu className="space-y-0.5">
          {navItems.map(({ path, label, icon: Icon, badgeKey }) => {
            const isActive = location.pathname === path;
            const showBadge = badgeKey === "messages" && unreadCount > 0 && !isActive;
            return (
              <SidebarMenuItem key={path}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className={`
                    w-full rounded-xl transition-all duration-150
                    ${isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    }
                  `}
                >
                  <Link to={path} onClick={closeSidebar} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="relative shrink-0">
                      <Icon size={18} />
                      {showBadge && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center leading-none">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="text-sm">{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer — user profile */}
      <SidebarFooter className="px-3 py-3 border-t border-sidebar-border">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 transition-colors hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground">
                <div className="w-7 h-7 rounded-lg bg-gradient-gold flex items-center justify-center text-charcoal font-bold text-xs shadow-gold shrink-0">
                  {initials}
                </div>
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="text-xs font-semibold text-sidebar-foreground truncate w-full">
                    {studio?.name ?? "My Studio"}
                  </span>
                  <span className="text-[11px] text-sidebar-foreground/50 truncate w-full">
                    {user.email}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-52 shadow-lg">
              <div className="px-3 py-2.5 border-b border-border/60">
                <p className="text-sm font-semibold truncate">{studio?.name ?? "My Studio"}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer gap-2.5 py-2.5 text-destructive focus:text-destructive"
              >
                <LogOut size={15} /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        {/* Main area — always full width since sidebar is offcanvas */}
        <div className="flex-1 flex flex-col min-w-0 w-full">

          {/* Top bar */}
          <header
            className="sticky top-0 z-40 flex items-center gap-3 h-14 px-4 border-b border-border/60"
            style={{ background: "hsl(var(--card) / 0.92)", backdropFilter: "blur(16px)" }}
          >
            {/* Always-visible toggle */}
            <SidebarTrigger className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0" />

            <div className="flex-1" />

            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl">
              <Bell size={17} />
            </Button>
          </header>

          {/* Page content */}
          <main className="flex-1 px-4 sm:px-6 py-6 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
