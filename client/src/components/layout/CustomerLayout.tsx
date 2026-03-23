import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { LayoutDashboard, FileText, MessageSquare, LogOut, Menu, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/requests', label: 'Requests', icon: MessageSquare },
];

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-full flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-emerald-600 p-2">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-800">PropertyPortal</span>
        </div>
      </div>
      <Separator />
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
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              )
            }
          >
            <item.icon className="h-4.5 w-4.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <Separator />
      <div className="p-4">
        <p className="text-xs text-slate-500 truncate mb-2">{user?.email}</p>
        <Button variant="ghost" size="sm" className="w-full justify-start text-slate-500" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>
    </div>
  );
}

export function CustomerLayout() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-white lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-20 flex items-center gap-4 border-b bg-white px-4 py-3 lg:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent onNavClick={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-emerald-600 p-1.5">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-slate-800">PropertyPortal</span>
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
