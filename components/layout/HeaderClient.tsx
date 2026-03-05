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
];

const NAV_LINKS: NavLink[] = [
  { label: "News", href: "/news" },
  { label: "Teams", href: "/teams", dropdown: "teams" },
  { label: "Spielplan", href: "/spielplan" },
  { label: "Magazine", href: "/spieltagsmagazin" },
  { label: "Impressionen", href: "/impressionen" },
  { label: "Verein", href: "/ueberuns", dropdown: "verein", staticItems: VEREIN_ITEMS },
];

// ─── WebGL smoke shaders ───────────────────────────────────────────────────────

const VERT_SHADER = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// FBM (fractional Brownian motion) smoke, adapted from:
// https://www.shadertoy.com/view/lsl3RH
// Club colours cycle: red-orange (#ff3300) → blue-purple (#7755cc) → white-pink (#ffccdd)
const FRAG_SHADER = `
  precision mediump float;
  uniform vec2  iResolution;
  uniform float iTime;

  float random(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2  u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2  shift = vec2(20.0);
    mat2  rot   = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 8; i++) {
      v  += a * noise(p);
      p   = rot * p * 2.0 + shift;
      a  *= 0.5;
    }
    return v;
  }

  void main(void) {
    vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
    uv *= 0.5;

    vec2 q = vec2(
      fbm(uv + 0.20 * iTime),
      fbm(uv + vec2(5.0, 1.0))
    );
    vec2 r = vec2(
      fbm(uv + 3.0 * q + vec2(1.2, 3.2) + 0.2 * iTime),
      fbm(uv + 3.0 * q + vec2(8.8, 2.8) + 0.2 * iTime)
    );

    float f = fbm(uv + r);

    // Club colour palette
    vec3 red    = vec3(1.00, 0.20, 0.00);  // #ff3300
    vec3 purple = vec3(0.47, 0.33, 0.80);  // #7755cc
    vec3 pink   = vec3(1.00, 0.80, 0.87);  // #ffccdd

    // Smooth cycle through all 3 colours (~42 s per full rotation)
    float cy = iTime * 0.15;
    vec3 col1 = mix(red,    purple, 0.5 + 0.5 * sin(cy));
    vec3 col2 = mix(purple, pink,   0.5 + 0.5 * sin(cy + 2.094));
    vec3 col3 = mix(pink,   red,    0.5 + 0.5 * sin(cy + 4.189));

    vec3 color = mix(vec3(0.0), col1, clamp(f * f * 4.0,          0.0, 1.0));
    color = mix(color, col2,          clamp(length(q) * length(q), 0.0, 1.0));
    color = mix(color, col3,          clamp(length(r.x),           0.0, 0.15));

    // Dark base matching header background (#1a0005)
    color = vec3(0.102, 0.0, 0.02) + (f * f * f + 0.6 * f * f + 0.5 * f) * color;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────

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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialise isDark from the class already applied by the anti-flash script.
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  // WebGL FBM smoke animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    function compileShader(type: number, src: string): WebGLShader {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }

    const vs = compileShader(gl.VERTEX_SHADER, VERT_SHADER);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAG_SHADER);

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const resLoc  = gl.getUniformLocation(program, "iResolution");
    const timeLoc = gl.getUniformLocation(program, "iTime");

    let raf = 0;
    const t0 = performance.now();

    function resize() {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      gl!.viewport(0, 0, canvas.width, canvas.height);
    }

    function render() {
      if (!canvas) return;
      gl!.uniform2f(resLoc, canvas.width, canvas.height);
      gl!.uniform1f(timeLoc, (performance.now() - t0) / 1000);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    }

    resize();
    render();
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      gl.deleteProgram(program);
    };
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
      {/* WebGL smoke canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ display: "block" }}
      />
      {/* Semi-transparent overlay to unify canvas with nav text readability */}
      <div className="header-overlay" />

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
            <span className="text-blue-400 font-bold">MIPA</span>
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
