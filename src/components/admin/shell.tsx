'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  CalendarHeart,
  History,
  Images,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Mic,
  Settings,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';

const LINKS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/response', label: 'Date Response', icon: CalendarHeart },
  { href: '/admin/voice', label: 'Voice Message', icon: Mic },
  { href: '/admin/photos', label: 'Photo Gallery', icon: Images },
  { href: '/admin/location', label: 'Shared Location', icon: MapPin },
  { href: '/admin/history', label: 'Submission History', icon: History },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminShell({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      router.replace('/admin/login');
      router.refresh();
      setLoggingOut(false);
    }
  }

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Admin sections">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={clsx(
              'flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[0.85rem] transition',
              active
                ? 'bg-[#3B2730] text-[#FBF3EC] shadow-[0_12px_28px_-20px_rgba(59,39,48,0.9)]'
                : 'text-[#6D575B] hover:bg-[#F4ECE5] hover:text-[#3B2730]',
            )}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="h-4 w-4" strokeWidth={1.6} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-[100svh] bg-[#F8F3ED] text-[#3B2730]">
      <div className="mx-auto flex max-w-[1400px]">
        <aside className="sticky top-0 hidden h-[100svh] w-[248px] shrink-0 flex-col justify-between border-r border-[#E7DCD2] bg-[#FCF8F3] px-4 py-6 lg:flex">
          <div>
            <div className="px-2">
              <p className="font-display text-[1.24rem] leading-none text-[#3B2730]">For Samiya</p>
              <p className="mt-1.5 text-[0.58rem] uppercase tracking-[0.26em] text-[#A0877C]">private admin</p>
            </div>
            <div className="my-5 h-px bg-[#EADFD6]" />
            {nav}
          </div>
          <div className="rounded-[12px] border border-[#EADFD6] bg-white/70 p-3">
            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[#A0877C]">Signed in as</p>
            <p className="mt-0.5 font-display text-[1rem] capitalize text-[#3B2730]">{username}</p>
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-[#DDCEC4] px-3 py-2 text-[0.7rem] uppercase tracking-[0.16em] text-[#6D575B] transition hover:bg-[#F4ECE5] disabled:opacity-60"
            >
              <LogOut className="h-3.5 w-3.5" strokeWidth={1.6} />
              {loggingOut ? 'Signing out…' : 'Log out'}
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[#E7DCD2] bg-[#FCF8F3]/90 px-4 py-3 backdrop-blur lg:hidden">
            <div>
              <p className="font-display text-[1.06rem] leading-none">For Samiya</p>
              <p className="mt-0.5 text-[0.54rem] uppercase tracking-[0.22em] text-[#A0877C]">private admin</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DDCEC4] text-[#5A444A]"
              aria-expanded={open}
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </header>

          {open && (
            <div className="border-b border-[#E7DCD2] bg-[#FCF8F3] px-4 py-4 lg:hidden">
              {nav}
              <button
                type="button"
                onClick={logout}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-[#DDCEC4] px-3 py-2 text-[0.7rem] uppercase tracking-[0.16em] text-[#6D575B]"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.6} />
                Log out
              </button>
            </div>
          )}

          <main className="px-4 py-6 sm:px-7 sm:py-9">{children}</main>
        </div>
      </div>
    </div>
  );
}
