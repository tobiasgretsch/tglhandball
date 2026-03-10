"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Menu, X, Sun, Moon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
}

interface Props {
  role: string;
  navItems: NavItem[];
  userName: string;
  userEmail: string;
}

function isActive(pathname: string, item: NavItem, navItems: NavItem[]) {
  return (
    pathname === item.href ||
    (pathname.startsWith(item.href + "/") &&
      !navItems.some(
        (other) => other.href !== item.href && pathname.startsWith(other.href)
      ))
  );
}

function SidebarContent({
  role,
  navItems,
  userName,
  userEmail,
  onNavigate,
  isDark,
  onToggleTheme,
}: Props & { onNavigate?: () => void; isDark: boolean; onToggleTheme: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a]">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <Link
          href="/"
          className="font-black text-white text-base uppercase tracking-tight"
          onClick={onNavigate}
        >
          TG <span className="text-primary">MIPA</span>{" "}
          <span className="text-white/40 font-medium">Landshut</span>
        </Link>
        <span
          className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            role === "trainer"
              ? "bg-primary/20 text-primary"
              : "bg-accent/20 text-blue-400"
          }`}
        >
          {role}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
              isActive(pathname, item, navItems)
                ? "bg-primary text-white"
                : "text-white/55 hover:text-white hover:bg-white/8"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10 flex items-center gap-3">
        <UserButton />
        <div className="min-w-0 flex-1">
          <p className="text-white text-xs font-semibold truncate">{userName}</p>
          <p className="text-white/35 text-[11px] truncate">{userEmail}</p>
        </div>
        <button
          onClick={onToggleTheme}
          className="shrink-0 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          aria-label={isDark ? "Hellmodus" : "Dunkelmodus"}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function DashboardSidebar(props: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <>
      {/* ── Mobile: top bar + slide-out drawer ── */}
      <div className="md:hidden">
        {/* Fixed top bar */}
        <div className="fixed top-0 left-0 right-0 z-40 h-14 bg-[#1a1a1a] flex items-center px-4 gap-3 border-b border-white/10">
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-white p-1.5 -ml-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Menü öffnen"
          >
            <Menu size={22} />
          </button>
          <Link href="/" className="font-black text-white text-sm uppercase tracking-tight">
            TG <span className="text-primary">MIPA</span>{" "}
            <span className="text-white/40 font-medium text-xs">Landshut</span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              aria-label={isDark ? "Hellmodus" : "Dunkelmodus"}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <UserButton />
          </div>
        </div>

        {/* Drawer overlay */}
        {drawerOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setDrawerOpen(false)}
            />
            <div className="fixed top-0 left-0 bottom-0 w-72 z-50 shadow-2xl">
              <button
                onClick={() => setDrawerOpen(false)}
                className="absolute top-3 right-3 text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 z-10 transition-colors"
                aria-label="Menü schließen"
              >
                <X size={20} />
              </button>
              <SidebarContent {...props} onNavigate={() => setDrawerOpen(false)} isDark={isDark} onToggleTheme={toggleTheme} />
            </div>
          </>
        )}
      </div>

      {/* ── Desktop: fixed sidebar ── */}
      <aside className="hidden md:flex md:w-60 flex-col shrink-0 min-h-screen">
        <SidebarContent {...props} isDark={isDark} onToggleTheme={toggleTheme} />
      </aside>
    </>
  );
}
