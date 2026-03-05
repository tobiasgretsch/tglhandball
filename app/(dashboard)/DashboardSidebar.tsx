"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

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

export default function DashboardSidebar({ role, navItems, userName, userEmail }: Props) {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-gray-900 flex flex-col shrink-0 border-r border-white/5">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/" className="font-black text-white text-base uppercase tracking-tight">
          TG <span className="text-blue-400">MIPA</span>{" "}
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
        {navItems.map((item) => {
          // Exact match, OR starts-with only when no other nav item is a more specific match.
          // This prevents "/dashboard/trainer" from staying active on "/dashboard/trainer/spieler".
          const isActive =
            pathname === item.href ||
            (pathname.startsWith(item.href + "/") &&
              !navItems.some(
                (other) => other.href !== item.href && pathname.startsWith(other.href)
              ));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/55 hover:text-white hover:bg-white/6"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10 flex items-center gap-3">
        <UserButton />
        <div className="min-w-0">
          <p className="text-white text-xs font-semibold truncate">{userName}</p>
          <p className="text-white/35 text-[11px] truncate">{userEmail}</p>
        </div>
      </div>
    </aside>
  );
}
