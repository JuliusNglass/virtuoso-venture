import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Users, BookOpen, Calendar, Music, 
  FileText, CreditCard, MessageSquare, Menu, X 
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/students", label: "Students", icon: Users },
  { path: "/lessons", label: "Lessons", icon: BookOpen },
  { path: "/calendar", label: "Calendar", icon: Calendar },
  { path: "/repertoire", label: "Repertoire", icon: Music },
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gradient-dark text-sidebar-foreground 
        transform transition-transform duration-300 lg:translate-x-0 lg:static
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="font-heading text-2xl font-bold">
            <span className="text-gradient-gold">Shanika</span>
          </h1>
          <p className="text-sm text-sidebar-foreground/60 mt-1">Piano Academy</p>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-sidebar-accent text-gold shadow-gold' 
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  }
                `}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-foreground/50 lg:hidden" 
          onClick={() => setMobileOpen(false)} 
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between lg:justify-end">
          <button 
            onClick={() => setMobileOpen(true)} 
            className="lg:hidden text-foreground"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-gradient-gold flex items-center justify-center text-charcoal font-bold text-sm">
              S
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
