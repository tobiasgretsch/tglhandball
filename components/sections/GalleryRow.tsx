import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import GalleryStrip from "@/components/sections/GalleryStrip";
import Reveal from "@/components/ui/Reveal";
import type { GalleryItem } from "@/types";

interface GalleryRowProps {
  photos: Pick<GalleryItem, "_id" | "image" | "caption">[];
  /** Gallery filter the photos link to: a team slug, or CLUB_GALLERY_FILTER. */
  filter: string;
  /** Section background; follows the alternation of the surrounding page. */
  className?: string;
}

/** Horizontal photo strip; every photo opens the gallery with the matching filter. */
export default function GalleryRow({
  photos,
  filter,
  className = "bg-white dark:bg-gray-800",
}: GalleryRowProps) {
  const t = useTranslations("gallery");
  if (photos.length === 0) return null;

  const galleryHref = `/impressionen?team=${encodeURIComponent(filter)}`;

  return (
    <section className={`${className} py-14 md:py-20`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <Reveal>
            <h2 className="font-display font-bold italic uppercase text-4xl md:text-5xl tracking-[-0.02em] text-text dark:text-gray-100">
              {t("row.title")}
            </h2>
          </Reveal>
          <Link
            href={galleryHref}
            className="press shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-link hover:underline underline-offset-4"
          >
            {t("row.viewAll")} <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-8">
          <GalleryStrip
            tiles={photos.map((photo) => ({
              id: photo._id,
              href: galleryHref,
              image: photo.image,
              alt: photo.image.alt ?? photo.caption ?? t("row.photoAlt"),
            }))}
          />
        </div>
      </div>
    </section>
  );
}
