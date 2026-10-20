import { urlFor } from "@/lib/sanity";
import type { SanityImage } from "@/types";

/** 4:5 portrait, 2× the widest card (~320 css px) so it stays sharp on retina. */
const PHOTO_WIDTH = 640;
const PHOTO_HEIGHT = 800;
const PHOTO_QUALITY = 80;

export type PhotoCrop = "top" | "center";

export interface PersonPhoto {
  src: string;
  /** Tiny base64 preview from Sanity asset metadata, shown while the photo loads. */
  blurDataURL?: string;
}

/**
 * Resizes on Sanity's CDN so an oversized upload is never sent to the visitor.
 * A hotspot/crop set in the Studio decides what is kept; without one, `cropFrom` decides
 * ("top" keeps the head of a full-body shot, "center" suits portraits).
 */
export function toPersonPhoto(
  image?: SanityImage,
  cropFrom: PhotoCrop = "top"
): PersonPhoto | null {
  if (!image?.asset) return null;
  const sized = urlFor(image)
    .width(PHOTO_WIDTH)
    .height(PHOTO_HEIGHT)
    .fit("crop")
    .auto("format")
    .quality(PHOTO_QUALITY);
  // An explicit crop direction would override the Studio hotspot, so only set it without one.
  const hasStudioFraming = Boolean(image.hotspot || image.crop);
  return {
    src: (hasStudioFraming ? sized : sized.crop(cropFrom)).url(),
    blurDataURL: image.lqip,
  };
}
