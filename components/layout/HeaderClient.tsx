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

// Each entry: array of [pathD, strokeColor, strokeWidth, opacity]
type WispStrand = [string, string, number, number];
interface SmokeWisp { strands: WispStrand[] }

const SMOKE_WISPS: SmokeWisp[] = [
  { strands: [
    ["M0,40 C120,22 280,58 450,36 C600,18 720,52 820,38", "rgba(255,70,20,0.55)", 2.0, 1],
    ["M0,46 C140,30 300,64 480,42 C640,24 750,58 820,46", "rgba(255,70,20,0.28)", 1.5, 1],
  ]},
  { strands: [
    ["M0,35 C80,16 200,54 340,30 C470,10 590,50 720,26 C780,16 812,38 820,32", "rgba(110,75,210,0.52)", 2.0, 1],
    ["M0,42 C100,24 220,62 360,38 C490,16 610,56 740,32 C792,20 816,44 820,40", "rgba(110,75,210,0.26)", 1.5, 1],
  ]},
  { strands: [
    ["M0,50 C200,36 400,66 600,46 C710,34 792,58 820,50", "rgba(255,200,215,0.45)", 2.0, 1],
    ["M0,44 C180,30 380,60 580,40 C700,28 792,54 820,44", "rgba(255,200,215,0.22)", 1.5, 1],
  ]},
  { strands: [
    ["M0,38 C150,18 350,58 520,30 C660,12 762,50 820,36", "rgba(200,10,0,0.58)", 2.5, 1],
    ["M0,46 C170,28 370,64 550,38 C680,20 772,54 820,44", "rgba(200,10,0,0.28)", 1.5, 1],
    ["M0,32 C130,14 320,52 500,26 C650,8 755,46 820,30", "rgba(200,10,0,0.18)", 1.0, 1],
  ]},
  { strands: [
    ["M0,36 C250,18 450,58 650,30 C742,18 802,46 820,36", "rgba(40,20,160,0.45)", 2.0, 1],
    ["M0,44 C240,28 440,64 640,40 C742,26 804,52 820,44", "rgba(40,20,160,0.22)", 1.5, 1],
    ["M0,52 C260,36 460,70 660,48 C752,34 806,60 820,52", "rgba(40,20,160,0.14)", 1.0, 1],
  ]},
  { strands: [
    ["M0,28 C100,12 240,50 400,22 C520,4 642,44 762,20 C802,10 818,32 820,26", "rgba(255,255,255,0.40)", 1.5, 1],
    ["M0,36 C120,18 260,58 420,30 C542,12 662,52 782,26 C812,16 820,38 820,34", "rgba(255,255,255,0.18)", 1.0, 1],
  ]},
  { strands: [
    ["M0,54 C180,36 360,72 540,48 C680,30 772,64 820,52", "rgba(255,55,10,0.50)", 2.0, 1],
    ["M0,60 C200,44 400,76 600,54 C732,36 802,68 820,60", "rgba(255,55,10,0.24)", 1.5, 1],
  ]},
  { strands: [
    ["M0,38 C160,20 320,58 500,32 C642,14 752,52 820,36", "rgba(100,55,200,0.50)", 2.0, 1],
    ["M0,46 C180,28 340,64 520,40 C662,22 762,58 820,44", "rgba(100,55,200,0.24)", 1.5, 1],
  ]},
  { strands: [
    ["M0,42 C220,24 440,64 640,36 C742,22 802,54 820,42", "rgba(255,170,195,0.44)", 2.0, 1],
    ["M0,50 C240,34 460,70 660,44 C756,30 808,60 820,50", "rgba(255,170,195,0.20)", 1.5, 1],
  ]},
  { strands: [
    ["M0,34 C280,16 520,58 720,30 C792,18 818,46 820,34", "rgba(185,0,0,0.55)", 2.5, 1],
    ["M0,42 C300,24 540,66 740,38 C804,24 820,52 820,42", "rgba(185,0,0,0.26)", 1.5, 1],
    ["M0,28 C260,10 500,52 700,24 C784,12 818,40 820,28", "rgba(185,0,0,0.16)", 1.0, 1],
  ]},
];

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
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudsRef = useRef<HTMLDivElement>(null);

  // Initialise isDark from the class already applied by the anti-flash script.
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  // Randomise each cloud's animation-delay and vertical position on every load
  // for organic, non-repeating variation.
  useEffect(() => {
    const clouds = cloudsRef.current?.querySelectorAll<HTMLElement>("[data-cloud]");
    clouds?.forEach((cloud) => {
      cloud.style.animationDelay = `-${(Math.random() * 12).toFixed(2)}s`;
      cloud.style.top = `${(Math.random() * 75 + 5).toFixed(1)}%`;
    });
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
    <header
      className={`header-bg fixed top-0 left-0 right-0 z-50 transition-shadow duration-300 ${
        scrolled ? "shadow-[0_4px_32px_rgba(0,0,0,0.35)]" : ""
      }`}
    >
      {/* Smoke wisp layer */}
      <div ref={cloudsRef} className="absolute inset-0 overflow-hidden pointer-events-none">
        {SMOKE_WISPS.map((wisp, i) => (
          <svg
            key={i}
            data-cloud
            className={`hcloud-${i + 1}`}
            viewBox="0 0 820 76"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
          >
            {wisp.strands.map(([d, stroke, strokeWidth, opacity], j) => (
              <path
                key={j}
                d={d}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={opacity}
                fill="none"
              />
            ))}
          </svg>
        ))}
        <div className="header-overlay" />
      </div>

      {/* Inner nav bar */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[68px] lg:h-[76px] flex items-center justify-between">
        {/* Logo + club name */}
        <Link href="/" className="flex items-center gap-3 group">
          {logoUrl && (
            <Image
              src={logoUrl}
              alt={clubName}
              width={44}
              height={44}
              className="object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-200"
              priority
            />
          )}
          <span className="font-black text-white text-lg lg:text-xl tracking-tight uppercase leading-none select-none">
            TG{" "}
            <span className="text-white/60 font-bold">MIPA</span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {NAV_LINKS.map((link) =>
            link.dropdown ? (
              <div
                key={link.href}
                className="relative"
                onMouseEnter={() => openMenu(link.dropdown!)}
                onMouseLeave={scheduleClose}
              >
                <button
                  className={`relative flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold uppercase tracking-[0.12em] rounded-sm transition-colors ${
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
                      className="absolute top-full left-0 mt-1 w-56 bg-accent rounded-sm shadow-2xl overflow-hidden"
                    >
                      {link.dropdown === "teams" && (
                        <>
                          {teams.map((team) => (
                            <Link
                              key={team._id}
                              href={`/teams/${team.slug.current}`}
                              className="block px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white/85 hover:bg-white/10 hover:text-white transition-colors border-b border-white/10 last:border-0"
                            >
                              {team.name}
                              {team.league && (
                                <span className="block text-[10px] text-white/45 font-normal normal-case tracking-normal mt-0.5">
                                  {team.league}
                                </span>
                              )}
                            </Link>
                          ))}
                          <Link
                            href="/teams"
                            className="block px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white/50 hover:text-white hover:bg-white/10 transition-colors"
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
                            className="block px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white/85 hover:bg-white/10 hover:text-white transition-colors border-b border-white/10 last:border-0"
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
                className={`relative px-4 py-2 text-[12px] font-bold uppercase tracking-[0.12em] rounded-sm transition-colors ${
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

      {/* ── Mobile drawer ───────────────────────────────────────────────── */}
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
              className="fixed top-0 right-0 h-full w-80 bg-accent z-50 flex flex-col shadow-2xl"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 h-[68px] border-b border-white/10">
                <span className="font-black text-white text-sm uppercase tracking-widest">
                  Navigation
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="text-white/70 hover:text-white p-1 transition-colors"
                  aria-label="Menü schließen"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Drawer links */}
              <nav className="flex-1 overflow-y-auto py-4">
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.055, duration: 0.22 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center px-6 py-4 text-[12px] font-bold uppercase tracking-widest border-b border-white/10 transition-colors ${
                        isActive(link)
                          ? "text-white bg-white/10"
                          : "text-white/75 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {link.label}
                    </Link>

                    {/* Inline team list under Teams */}
                    {link.dropdown === "teams" && teams.length > 0 && (
                      <div className="bg-black/20">
                        {teams.map((team) => (
                          <Link
                            key={team._id}
                            href={`/teams/${team.slug.current}`}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center pl-10 pr-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-white/55 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5"
                          >
                            {team.name}
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Inline Verein sub-links */}
                    {link.dropdown === "verein" && link.staticItems && (
                      <div className="bg-black/20">
                        {link.staticItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center pl-10 pr-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-white/55 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
