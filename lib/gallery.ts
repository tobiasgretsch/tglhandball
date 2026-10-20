import type { GalleryItem } from "@/types";

/** Gallery filter value and label for photos that are not tagged with a team. */
export const CLUB_GALLERY_FILTER = "verein";
export const CLUB_GALLERY_LABEL = "Verein";

export interface GalleryHighlight {
  item: GalleryItem;
  /** Verein or team name. */
  label: string;
  /** Value for the gallery's ?team= parameter. */
  filter: string;
}

/** One random photo per selection (Verein first, then teams A–Z). */
export function pickOnePerSelection(items: GalleryItem[]): GalleryHighlight[] {
  const groups = new Map<string, GalleryHighlight[]>();
  for (const item of items) {
    const label = item.team?.name ?? CLUB_GALLERY_LABEL;
    const filter = item.team?.slug?.current ?? CLUB_GALLERY_FILTER;
    groups.set(filter, [...(groups.get(filter) ?? []), { item, label, filter }]);
  }

  return [...groups.values()]
    .map((candidates) => candidates[Math.floor(Math.random() * candidates.length)])
    .sort((a, b) => {
      if (a.filter === CLUB_GALLERY_FILTER) return -1;
      if (b.filter === CLUB_GALLERY_FILTER) return 1;
      return a.label.localeCompare(b.label, "de");
    });
}
