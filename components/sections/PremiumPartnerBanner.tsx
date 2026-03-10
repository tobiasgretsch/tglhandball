"use client";

import Image from "next/image";
import { useRef, useEffect } from "react";

export interface PartnerBannerItem {
  _id: string;
  name: string;
  logoUrl: string | null;
  websiteUrl?: string;
}

export type PartnerBannerVariant = "premium" | "standard";

interface Props {
  partners: PartnerBannerItem[];
  variant?: PartnerBannerVariant;
}

// px per animation frame (~60 fps) — auto-scroll speed
const SPEED = 0.2;
// Momentum decay per frame after drag release (0.92 = loses 8% velocity each frame)
const MOMENTUM_DECAY = 0.92;
// Stop applying momentum below this threshold
const MOMENTUM_THRESHOLD = 0.05;

const CARD_STYLES: Record<PartnerBannerVariant, string> = {
  premium:
    "flex items-center shrink-0 rounded px-12 py-7 transition-all duration-300 " +
    "bg-white/10 border border-white/10 " +
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] " +
    "hover:bg-white/18 hover:border-amber-400/40 " +
    "hover:shadow-[0_0_18px_rgba(251,191,36,0.12),inset_0_1px_0_rgba(255,255,255,0.12)]",
  standard:
    "flex items-center shrink-0 rounded px-5 py-3 transition-all duration-300 " +
    "bg-white/6 border border-white/8 " +
    "hover:bg-white/12 hover:border-white/20",
};

const LOGO_HEIGHT: Record<PartnerBannerVariant, number> = {
  premium: 70,
  standard: 36,
};

function PartnerCard({
  partner,
  variant,
}: {
  partner: PartnerBannerItem;
  variant: PartnerBannerVariant;
}) {
  const h = LOGO_HEIGHT[variant];

  const inner = partner.logoUrl ? (
    <Image
      src={partner.logoUrl}
      alt={partner.name}
      width={h * 3}
      height={h}
      draggable={false}
      className={`object-contain brightness-0 invert opacity-90 w-auto pointer-events-none`}
      style={{ height: h }}
    />
  ) : (
    <span
      className={`font-bold text-white/85 uppercase tracking-wider ${
        variant === "premium" ? "text-lg" : "text-[11px]"
      }`}
    >
      {partner.name}
    </span>
  );

  const cardClass = CARD_STYLES[variant];

  return partner.websiteUrl ? (
    <a
      href={partner.websiteUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${partner.name} – Website besuchen`}
      className={cardClass}
    >
      {inner}
    </a>
  ) : (
    <div className={cardClass}>{inner}</div>
  );
}

/**
 * A single infinite-scroll track.
 * - Auto-scrolls via requestAnimationFrame.
 * - Hover (desktop): pauses.
 * - Pointer drag (mouse + touch): directly moves the track; resumes on release.
 * - Links are protected: a tap without drag still navigates normally.
 */
function MarqueeTrack({
  partners,
  variant,
  reverse = false,
}: {
  partners: PartnerBannerItem[];
  variant: PartnerBannerVariant;
  reverse?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const didDragRef = useRef(false);
  const lastXRef = useRef(0);
  const velocityRef = useRef(0); // px/frame — carries drag momentum after release
  const rafRef = useRef<number | null>(null);

  const direction = reverse ? -1 : 1;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const loop = () => {
      if (draggingRef.current) {
        // During drag: position is set directly in onPointerMove, nothing to add here
      } else if (Math.abs(velocityRef.current) > MOMENTUM_THRESHOLD) {
        // Post-drag: coast with decaying momentum
        posRef.current += velocityRef.current;
        velocityRef.current *= MOMENTUM_DECAY;
      } else if (!pausedRef.current) {
        // Normal auto-scroll
        velocityRef.current = 0;
        posRef.current -= SPEED * direction;
      }

      const halfWidth = track.scrollWidth / 2;
      if (posRef.current < -halfWidth) posRef.current += halfWidth;
      if (posRef.current > 0) posRef.current -= halfWidth;

      track.style.transform = `translateX(${posRef.current}px)`;
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    didDragRef.current = false;
    velocityRef.current = 0;
    lastXRef.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const delta = e.clientX - lastXRef.current;
    if (Math.abs(delta) > 3) didDragRef.current = true;
    posRef.current += delta;
    // Track velocity as a rolling value for momentum handoff
    velocityRef.current = delta;
    lastXRef.current = e.clientX;
  };

  const onPointerUp = () => { draggingRef.current = false; };

  const onClickCapture = (e: React.MouseEvent) => {
    if (didDragRef.current) {
      e.preventDefault();
      e.stopPropagation();
      didDragRef.current = false;
    }
  };

  return (
    <div
      className="overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onDragStart={(e) => e.preventDefault()}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
    >
      <div ref={trackRef} className="flex gap-4" style={{ width: "max-content" }}>
        {[...partners, ...partners].map((partner, i) => (
          <PartnerCard key={`${partner._id}-${i}`} partner={partner} variant={variant} />
        ))}
      </div>
    </div>
  );
}

export default function PartnerBanner({ partners, variant = "premium" }: Props) {
  if (partners.length === 0) return null;

  const rowA = partners.filter((_, i) => i % 2 === 0);
  const rowB = partners.filter((_, i) => i % 2 === 1);

  return (
    <>
      {/* Desktop: single row */}
      <div className="hidden md:block">
        <MarqueeTrack partners={partners} variant={variant} />
      </div>

      {/* Mobile: two rows, second scrolls in reverse */}
      <div className="flex flex-col gap-3 md:hidden">
        <MarqueeTrack partners={rowA.length > 0 ? rowA : partners} variant={variant} />
        {rowB.length > 0 && <MarqueeTrack partners={rowB} variant={variant} reverse />}
      </div>
    </>
  );
}
