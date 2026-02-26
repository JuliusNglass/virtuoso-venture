import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Users, BookOpen, Calendar, Music, 
  FileText, UserPlus, Menu, X, LogOut, Bell,
  MoreHorizontal, ChevronDown
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStudio } from "@/hooks/useStudio";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const mainNav = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/students", label: "Students", icon: Users },
  { path: "/lessons", label: "Lessons", icon: BookOpen },
  { path: "/calendar", label: "Calendar", icon: Calendar },
];

const moreNav = [
  { path: "/repertoire", label: "Music Library", icon: Music },
  { path: "/files", label: "Files & Scores", icon: FileText },
  { path: "/requests", label: "Applications", icon: UserPlus },
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { studio } = useStudio();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initials = studio?.name
    ? studio.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "C";

  const isMoreActive = moreNav.some(n => location.pathname === n.path);

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-border/60" style={{ background: "hsl(var(--card) / 0.92)", backdropFilter: "blur(16px)" }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
                <span className="text-charcoal font-heading font-bold text-base">🎵</span>
              </div>
              <span className="font-heading text-lg font-bold hidden sm:block tracking-tight">
                {studio?.name ?? "Conservo"}
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {mainNav.map(({ path, label, icon: Icon }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                      ${isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }
                    `}
                  >
                    <Icon size={15} />
                    {label}
                  </Link>
                );
              })}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`
                    flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${isMoreActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }
                  `}>
                    <MoreHorizontal size={15} />
                    More
                    <ChevronDown size={13} className="opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 shadow-lg">
                  {moreNav.map(({ path, label, icon: Icon }) => (
                    <DropdownMenuItem key={path} onClick={() => navigate(path)} className="cursor-pointer gap-2.5 py-2.5">
                      <Icon size={15} className="text-muted-foreground" />
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon" className="relative w-9 h-9 rounded-xl">
                <Bell size={17} />
              </Button>

              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-9 h-9 rounded-xl bg-gradient-gold flex items-center justify-center text-charcoal font-bold text-sm shadow-gold hover:shadow-gold-lg transition-shadow">
                      {initials}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 shadow-lg">
                    <div className="px-3 py-2.5 border-b border-border/60">
                      <p className="text-sm font-semibold truncate">{studio?.name ?? "My Studio"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer gap-2.5 py-2.5 text-destructive focus:text-destructive">
                      <LogOut size={15} /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-foreground hover:bg-muted transition-colors ml-1"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-border/60 bg-card px-4 py-3 space-y-1 animate-slide-up">
            {[...mainNav, ...moreNav].map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }
                  `}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-border/60 mt-2">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-colors"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
