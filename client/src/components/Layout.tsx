import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  PackagePlus,
  Cpu,
  ReceiptText,
  CalendarRange,
  TrendingUp,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/acquisition', label: 'Acquisition', icon: PackagePlus },
  { to: '/sell-build', label: 'Sell Build', icon: Cpu },
  { to: '/sold-items', label: 'Sold Items', icon: ReceiptText },
  { to: '/monthly-summary', label: 'Monthly Summary', icon: CalendarRange },
  { to: '/price-index', label: 'Price Index', icon: TrendingUp },
];

const NAME_ORIGIN =
  'Flippy: buy, flip, sell. Floppy: PC hardware, and the thing whose one job was holding onto data that mattered.';

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-1" title={NAME_ORIGIN}>
      <img src="/logo.png" alt="" className="h-9 w-9 shrink-0 rounded-xl shadow-md shadow-brand-500/30" />
      <div className="leading-tight">
        <p className="font-display text-base font-extrabold tracking-tight text-slate-900 dark:text-white">FlippyFloppy</p>
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">PC Flipping Tracker</p>
      </div>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
            }`
          }
        >
          <Icon size={18} strokeWidth={2.25} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export function Layout() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const currentLabel = NAV_ITEMS.find((item) => (item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)))?.label ?? 'FlippyFloppy';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex">
        <div className="border-b border-slate-100 px-4 py-5 dark:border-slate-800">
          <Logo />
        </div>
        <NavList />
        <div className="border-t border-slate-100 p-3 dark:border-slate-800">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          >
            <LogOut size={18} strokeWidth={2.25} />
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-5 dark:border-slate-800">
              <Logo />
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>
            <NavList onNavigate={() => setDrawerOpen(false)} />
            <div className="border-t border-slate-100 p-3 dark:border-slate-800">
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              >
                <LogOut size={18} strokeWidth={2.25} />
                Log out
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 py-3.5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
            >
              <Menu size={20} />
            </button>
            <h1 className="font-display text-lg font-bold text-slate-900 dark:text-white sm:text-xl">{currentLabel}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900/60 dark:text-brand-200">
              A
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
