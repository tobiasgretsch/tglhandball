"use client";

import { useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { PersonPhoto } from "@/lib/personPhoto";

const CARD_SIZES = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";
const FLIP_EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

interface PersonCardProps {
  name: string;
  subtitle?: string;
  photo: PersonPhoto | null;
  /** Second photo; the card only flips when this is set. */
  photoBack?: PersonPhoto | null;
  /** Placeholder shown when there is no photo. */
  fallbackIcon: ReactNode;
  /** Jersey number badge. */
  badge?: number;
  /** Surface colours of the card, differs per section background. */
  surfaceClassName: string;
}

function PhotoFace({ photo, alt }: { photo: PersonPhoto; alt: string }) {
  return (
    <Image
      src={photo.src}
      alt={alt}
      fill
      sizes={CARD_SIZES}
      placeholder={photo.blurDataURL ? "blur" : "empty"}
      blurDataURL={photo.blurDataURL}
      className="object-cover object-top"
    />
  );
}

export default function PersonCard({
  name,
  subtitle,
  photo,
  photoBack,
  fallbackIcon,
  badge,
  surfaceClassName,
}: PersonCardProps) {
  const t = useTranslations("personCard");
  const [flipped, setFlipped] = useState(false);
  // The back photo is only requested once the visitor shows interest in the card,
  // so cards nobody touches cost one image instead of two.
  const [backRequested, setBackRequested] = useState(false);
  const lastInput = useRef<string>("keyboard");

  const canFlip = Boolean(photoBack);

  // Mouse users flip via CSS hover; click only toggles for touch, pen and keyboard.
  const handleClick = () => {
    if (lastInput.current === "mouse") return;
    setBackRequested(true);
    setFlipped((value) => !value);
  };

  const frontFace = (
    <>
      {photo ? (
        <PhotoFace photo={photo} alt={name} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">{fallbackIcon}</div>
      )}
      {badge !== undefined && (
        <span className="absolute top-2 left-2 bg-primary text-white text-xs md:text-sm font-bold tabular-nums w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center leading-none shadow-sm">
          {badge}
        </span>
      )}
    </>
  );

  return (
    <div
      className={`group bg-white rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-[0_1px_2px_rgb(0_0_0/0.05)] hover:shadow-[0_12px_32px_-12px_rgb(0_0_0/0.25)] transition-shadow duration-300 ${surfaceClassName}`}
    >
      <div className="relative aspect-[4/5] bg-gradient-to-b from-gray-100 dark:from-gray-600 to-gray-200 dark:to-gray-700 [perspective:1000px] group/flip">
        {canFlip ? (
          <button
            type="button"
            aria-pressed={flipped}
            aria-label={t(flipped ? "hideSecond" : "showSecond", { name })}
            onClick={handleClick}
            onPointerDown={(event) => {
              lastInput.current = event.pointerType;
            }}
            onKeyDown={() => {
              lastInput.current = "keyboard";
            }}
            onPointerEnter={() => setBackRequested(true)}
            onFocus={() => setBackRequested(true)}
            className={`absolute inset-0 block w-full cursor-pointer [transform-style:preserve-3d] transition-transform duration-700 ${FLIP_EASE} motion-reduce:transition-none group-hover/flip:[transform:rotateY(180deg)] ${
              flipped ? "[transform:rotateY(180deg)]" : ""
            }`}
          >
            <div className="absolute inset-0 overflow-hidden [backface-visibility:hidden]">
              {frontFace}
            </div>
            <div className="absolute inset-0 overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)]">
              {backRequested && photoBack && (
                <PhotoFace photo={photoBack} alt={t("secondAlt", { name })} />
              )}
            </div>
          </button>
        ) : (
          <div className="absolute inset-0 overflow-hidden">{frontFace}</div>
        )}
      </div>
      <div className="p-3 md:p-4">
        <p className="font-semibold text-text dark:text-gray-100 text-sm leading-tight truncate">
          {name}
        </p>
        {subtitle && <p className="text-muted text-xs mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>
  );
}
