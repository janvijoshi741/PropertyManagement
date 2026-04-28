import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Shield, LayoutDashboard, Users, MessageSquare, Upload, LogOut, Menu, History, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/clients', label: 'Clients', icon: Building2 },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/requests', label: 'Requests', icon: MessageSquare },
  { to: '/admin/audit', label: 'Audit Logs', icon: History },
];

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { logout } = useAuth();
  const { branding } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      <div className="p-6">
        <div className="flex items-center gap-3">
          {branding?.logo_url ? (
            <img src={branding.logo_url} alt={branding.name} className="h-8 w-auto" />
          ) : (
            <div className="rounded-lg p-2" style={{ backgroundColor: 'var(--primary, #0f172a)' }}>
              <Shield className="h-5 w-5 text-white" />
            </div>
          )}
          <div>
            <span className="text-lg font-bold">
              {branding?.name || 'Portal'}
            </span>
            <Badge 
              className="ml-2 text-white text-[10px] px-1.5"
              style={{ backgroundColor: 'var(--primary, #0f172a)' }}
            >
              Master
            </Badge>
          </div>
        </div>
      </div>
      <Separator className="bg-slate-700" />
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavClick}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-600/10 text-emerald-400 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )
            }
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <Separator className="bg-slate-700" />
      <div className="p-4">
        <Button variant="ghost" size="sm" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { branding } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-20 flex items-center gap-4 border-b bg-slate-900 px-4 py-3 lg:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger>
            <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 border-0">
            <SidebarContent onNavClick={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-3">
          {branding?.logo_url ? (
            <img src={branding.logo_url} alt={branding.name} className="h-6 w-auto" />
          ) : (
            <Shield className="h-5 w-5 text-emerald-400" />
          )}
          <span className="font-bold text-white">
            {branding?.name ? `${branding.name} Admin` : 'Admin Portal'}
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
