import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSlidingIndicator } from './useSlidingIndicator';
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
      <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="h-9 w-9 shrink-0 rounded-xl shadow-md shadow-brand-500/30" />
      <div className="leading-tight">
        <p className="font-display text-base font-extrabold tracking-tight text-slate-900 dark:text-white">FlippyFloppy</p>
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">PC Flipping Tracker</p>
      </div>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  // NavLink marks the current page with aria-current="page"; the highlight slides to it.
  const { containerRef, style, transitionClass } = useSlidingIndicator<HTMLElement>(pathname, '[aria-current="page"]');

  return (
    <nav ref={containerRef} className="relative flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      <span aria-hidden="true" className={`absolute rounded-xl bg-brand-500 shadow-sm shadow-brand-500/30 ${transitionClass}`} style={style} />
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-300 ${
              isActive
                ? 'text-white'
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

const menuItemClass =
  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none';

/**
 * The "A" avatar in the header. Opens a small menu with the light/dark
 * toggle and Log out. Escape or a click outside closes it.
 */
function AccountMenu() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();

    function handlePointer(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
        const i = items.indexOf(document.activeElement as HTMLElement);
        const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
        items[next]?.focus();
      }
    }
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const dark = theme === 'dark';

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 transition hover:ring-2 hover:ring-brand-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 dark:bg-brand-900/60 dark:text-brand-200"
      >
        A
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full mt-2 w-52 origin-top-right animate-pop-in rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900"
        >
          <button
            role="menuitem"
            onClick={toggleTheme}
            className={`${menuItemClass} text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:bg-slate-800`}
          >
            {dark ? <Sun size={18} strokeWidth={2.25} /> : <Moon size={18} strokeWidth={2.25} />}
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
          <button
            role="menuitem"
            onClick={logout}
            className={`${menuItemClass} text-slate-600 hover:bg-red-50 hover:text-red-600 focus-visible:bg-red-50 focus-visible:text-red-600 dark:text-slate-300 dark:hover:bg-red-950/40 dark:hover:text-red-400 dark:focus-visible:bg-red-950/40 dark:focus-visible:text-red-400`}
          >
            <LogOut size={18} strokeWidth={2.25} />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export function Layout() {
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
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 animate-fade-in bg-slate-900/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 animate-drawer-in flex-col bg-white shadow-2xl dark:bg-slate-900">
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
          <AccountMenu />
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <div key={location.pathname} className="animate-rise-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
