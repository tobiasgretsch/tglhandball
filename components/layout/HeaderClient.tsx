"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Sun, Moon } from "lucide-react";

interface TeamItem {
  _id: string;
  name: string;
  slug: { current: string };
  league?: string;
}

interface HeaderClientProps {
  logoUrl: string | null;
  clubName: string;
  teams: TeamItem[];
}

interface StaticDropdownItem {
  label: string;
  href: string;
}

interface NavLink {
  label: string;
  href: string;
  dropdown?: "teams" | "verein";
  staticItems?: StaticDropdownItem[];
}

const VEREIN_ITEMS: StaticDropdownItem[] = [
  { label: "Über uns", href: "/ueberuns" },
  { label: "Partner", href: "/partner" },
  { label: "Mitgliederbereich", href: "/dashboard" },
];

const NAV_LINKS: NavLink[] = [
  { label: "News", href: "/news" },
  { label: "Teams", href: "/teams", dropdown: "teams" },
  { label: "Spielplan", href: "/spielplan" },
  { label: "Magazine", href: "/spieltagsmagazin" },
  { label: "Impressionen", href: "/impressionen" },
  { label: "Verein", href: "/ueberuns", dropdown: "verein", staticItems: VEREIN_ITEMS },
];

export default function HeaderClient({
  logoUrl,
  clubName,
  teams,
}: HeaderClientProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<"teams" | "verein" | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<Set<string>>(new Set());

  const toggleMobileSection = (key: string) => {
    setMobileExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialise isDark from the class already applied by the anti-flash script.
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // localStorage unavailable (e.g., private browsing)
    }
  };

  const isActive = (link: NavLink) => {
    if (link.staticItems) {
      return link.staticItems.some(
        (item) => pathname === item.href || pathname.startsWith(item.href + "/")
      );
    }
    return pathname === link.href || pathname.startsWith(link.href + "/");
  };

  const openMenu = (key: "teams" | "verein") => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenDropdown(key);
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 120);
  };

  return (
    <>
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-primary/80 dark:bg-gray-900/90 backdrop-blur-md shadow-[0_2px_24px_rgba(0,0,0,0.2)]"
          : "bg-primary dark:bg-gray-900"
      }`}
    >
      {/* Text watermark — only visible at full opacity (top of page) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center">
        <span className="whitespace-nowrap font-black text-white/10 text-[72px] lg:text-[96px] uppercase tracking-tight leading-none select-none pl-6">
          TG MIPA LANDSHUT
        </span>
      </div>

      {/* Inner nav bar — shrinks slightly when scrolled */}
      <div className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all duration-300 ${
        scrolled ? "h-[54px] lg:h-[60px]" : "h-[68px] lg:h-[76px]"
      }`}>
        {/* Logo + club name */}
        <Link href="/" className="flex items-center gap-3 group">
          {logoUrl && (
            <Image
              src={logoUrl}
              alt={clubName}
              width={60}
              height={60}
              className="object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-200 brightness-0 invert dark:brightness-100 dark:invert-0"
              priority
            />
          )}
          <span className="font-black text-white text-xl lg:text-2xl tracking-tight uppercase leading-none select-none">
            TG{" "}
            <span className="text-blue-400 font-bold">MIPA</span>{" "}
            <span className="text-white/70 font-bold">LANDSHUT</span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden lg:flex items-center gap-0.5" aria-label="Hauptnavigation">
          {NAV_LINKS.map((link) =>
            link.dropdown ? (
              <div
                key={link.href}
                className="relative"
                onMouseEnter={() => openMenu(link.dropdown!)}
                onMouseLeave={scheduleClose}
              >
                <button
                  aria-haspopup="true"
                  aria-expanded={openDropdown === link.dropdown}
                  aria-label={`${link.label} – Untermenü`}
                  className={`relative flex items-center gap-1.5 px-4 py-2 text-[15px] font-bold uppercase tracking-[0.12em] rounded-sm transition-colors ${
                    isActive(link)
                      ? "text-white"
                      : "text-white/75 hover:text-white"
                  }`}
                >
                  {link.label}
                  <motion.span
                    animate={{ rotate: openDropdown === link.dropdown ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex"
                  >
                    <ChevronDown size={13} />
                  </motion.span>
                  {isActive(link) && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute bottom-0 inset-x-2 h-[2px] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                    />
                  )}
                </button>

                <AnimatePresence>
                  {openDropdown === link.dropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      onMouseEnter={() => openMenu(link.dropdown!)}
                      onMouseLeave={scheduleClose}
                      className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-[#8B0000] rounded-sm shadow-2xl overflow-hidden"
                    >
                      {link.dropdown === "teams" && (
                        <>
                          {teams.map((team) => (
                            <Link
                              key={team._id}
                              href={`/teams/${team.slug.current}`}
                              className="block px-4 py-3 text-[13px] font-bold uppercase tracking-wider text-gray-900 hover:bg-red-50 dark:text-white/85 dark:hover:bg-white/10 dark:hover:text-white transition-colors border-b border-gray-200 dark:border-white/10 last:border-0"
                            >
                              {team.name}
                              {team.league && (
                                <span className="block text-[12px] text-gray-500 dark:text-white/45 font-normal normal-case tracking-normal mt-0.5">
                                  {team.league}
                                </span>
                              )}
                            </Link>
                          ))}
                          <Link
                            href="/teams"
                            className="block px-4 py-3 text-[13px] font-bold uppercase tracking-wider text-gray-400 hover:text-gray-900 hover:bg-red-50 dark:text-white/50 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
                          >
                            Alle Teams →
                          </Link>
                        </>
                      )}
                      {link.dropdown === "verein" &&
                        link.staticItems?.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block px-4 py-3 text-[13px] font-bold uppercase tracking-wider text-gray-900 hover:bg-red-50 dark:text-white/85 dark:hover:bg-white/10 dark:hover:text-white transition-colors border-b border-gray-200 dark:border-white/10 last:border-0"
                          >
                            {item.label}
                          </Link>
                        ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 text-[15px] font-bold uppercase tracking-[0.12em] rounded-sm transition-colors ${
                  isActive(link)
                    ? "text-white"
                    : "text-white/75 hover:text-white"
                }`}
              >
                {link.label}
                {isActive(link) && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute bottom-0 inset-x-2 h-[2px] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                  />
                )}
              </Link>
            )
          )}

          {/* Theme toggle — desktop */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? "Helles Design aktivieren" : "Dunkles Design aktivieren"}
            className="ml-2 p-2 rounded-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </nav>

        {/* Mobile: theme toggle + hamburger */}
        <div className="lg:hidden flex items-center gap-1">
          <button
            onClick={toggleTheme}
            aria-label={isDark ? "Helles Design aktivieren" : "Dunkles Design aktivieren"}
            className="p-2 text-white/80 hover:text-white transition-colors"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="p-2 text-white/90 hover:text-white transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Menü öffnen"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

    </header>

      {/* ── Mobile drawer ── rendered outside <header> to avoid fixed-position clipping */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/55 z-40"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 32 }}
              className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-[#8B0000] z-50 flex flex-col shadow-2xl"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 h-[68px] border-b border-gray-200 dark:border-white/10">
                <span className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-widest">
                  Navigation
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="text-gray-500 hover:text-gray-900 dark:text-white/70 dark:hover:text-white p-1 transition-colors"
                  aria-label="Menü schließen"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Drawer links */}
              <nav className="flex-1 overflow-y-auto py-4" aria-label="Mobile Navigation">
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.055, duration: 0.22 }}
                  >
                    {link.dropdown ? (
                      /* Collapsible section header */
                      <button
                        onClick={() => toggleMobileSection(link.dropdown!)}
                        className={`w-full flex items-center justify-between px-6 py-4 text-[12px] font-bold uppercase tracking-widest border-b border-gray-200 dark:border-white/10 transition-colors ${
                          isActive(link)
                            ? "text-gray-900 bg-red-50 dark:text-white dark:bg-white/10"
                            : "text-gray-700 hover:text-gray-900 hover:bg-red-50 dark:text-white/75 dark:hover:text-white dark:hover:bg-white/5"
                        }`}
                      >
                        {link.label}
                        <motion.span
                          animate={{ rotate: mobileExpanded.has(link.dropdown) ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="inline-flex"
                        >
                          <ChevronDown size={14} />
                        </motion.span>
                      </button>
                    ) : (
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center px-6 py-4 text-[12px] font-bold uppercase tracking-widest border-b border-gray-200 dark:border-white/10 transition-colors ${
                          isActive(link)
                            ? "text-gray-900 bg-red-50 dark:text-white dark:bg-white/10"
                            : "text-gray-700 hover:text-gray-900 hover:bg-red-50 dark:text-white/75 dark:hover:text-white dark:hover:bg-white/5"
                        }`}
                      >
                        {link.label}
                      </Link>
                    )}

                    {/* Collapsible team list under Teams */}
                    <AnimatePresence initial={false}>
                      {link.dropdown === "teams" && mobileExpanded.has("teams") && teams.length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                          className="overflow-hidden bg-gray-50 dark:bg-black/20"
                        >
                          {teams.map((team) => (
                            <Link
                              key={team._id}
                              href={`/teams/${team.slug.current}`}
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center pl-10 pr-6 py-3 text-[13px] font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-900 hover:bg-red-50 dark:text-white/55 dark:hover:text-white dark:hover:bg-white/5 transition-colors border-b border-gray-200 dark:border-white/5"
                            >
                              {team.name}
                            </Link>
                          ))}
                          <Link
                            href="/teams"
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center pl-10 pr-6 py-3 text-[13px] font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-900 hover:bg-red-50 dark:text-white/40 dark:hover:text-white dark:hover:bg-white/5 transition-colors border-b border-gray-200 dark:border-white/5"
                          >
                            Alle Teams →
                          </Link>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Collapsible Verein sub-links */}
                    <AnimatePresence initial={false}>
                      {link.dropdown === "verein" && mobileExpanded.has("verein") && link.staticItems && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                          className="overflow-hidden bg-gray-50 dark:bg-black/20"
                        >
                          {link.staticItems.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center pl-10 pr-6 py-3 text-[13px] font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-900 hover:bg-red-50 dark:text-white/55 dark:hover:text-white dark:hover:bg-white/5 transition-colors border-b border-gray-200 dark:border-white/5"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
