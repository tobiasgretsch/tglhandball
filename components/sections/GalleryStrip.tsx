import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { urlFor } from "@/lib/sanity";
import type { SanityImage } from "@/types";

export interface GalleryStripTile {
  id: string;
  href: string;
  image: SanityImage;
  alt: string;
  /** Caption laid over the photo's lower edge. */
  label?: string;
}

/** Tiles that fit one row at md (3 columns) and lg and up (4 columns). */
const COLUMNS_MD = 3;
const COLUMNS_LG = 4;

/**
 * Photo row without a scrollbar: swipeable on touch screens (below md),
 * and a single row of as many tiles as fit on larger screens.
 */
export default function GalleryStrip({ tiles }: { tiles: GalleryStripTile[] }) {
  return (
    <ul className="-mx-4 sm:-mx-6 md:mx-0 px-4 sm:px-6 md:px-0 flex md:grid md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tiles.map((tile, index) => (
        <li
          key={tile.id}
          className={`snap-start shrink-0 w-[70%] sm:w-[40%] md:w-auto ${overflowClass(index)}`}
        >
          <Link
            href={tile.href}
            aria-label={tile.label ? `${tile.label}: ${tile.alt}` : tile.alt}
            className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-700 press-card"
          >
            <Image
              src={urlFor(tile.image).width(600).height(450).url()}
              alt={tile.alt}
              fill
              sizes="(max-width: 640px) 70vw, (max-width: 768px) 40vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover motion-safe:group-hover:scale-[1.03] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            />
            {tile.label && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <span className="absolute bottom-0 left-0 right-0 p-4 font-display font-bold italic uppercase text-xl text-white leading-none">
                  {tile.label}
                </span>
              </>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Hides the tiles that do not fit in the single row of the grid layout. */
function overflowClass(index: number): string {
  if (index >= COLUMNS_LG) return "md:hidden";
  if (index >= COLUMNS_MD) return "md:max-lg:hidden";
  return "";
}
