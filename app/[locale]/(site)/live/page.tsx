import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { client } from "@/lib/sanity";
import { pageHeroSlidesQuery } from "@/lib/queries";
import { getLiveSummary } from "@/lib/live/schedule";
import type { LiveGame, LiveSummary } from "@/lib/live/types";
import type { SanityImage } from "@/types";
import PageHeroSlider from "@/components/sections/PageHeroSlider";
import LiveGameList from "@/components/live/LiveGameList";
import { LiveListSkeleton } from "@/components/live/LiveSkeleton";
import { localizedAlternates } from "@/lib/seo";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "livePage" });
  return {
    alternates: localizedAlternates("/live", locale),
    title: t("title"),
    description: t("description"),
    openGraph: { title: `${t("title")} | TG MIPA Landshut`, type: "website" },
  };
}

/** One shared render per interval instead of one function per visitor; the header badge polls the live flag itself. */
export const revalidate = 15;
export const maxDuration = 15;

const LIST_LIMIT = 8;

/** `null` when nuLiga could not be reached, so the page can say so instead of showing "no games". */
async function loadSummary(): Promise<LiveSummary | null> {
  try {
    return await getLiveSummary();
  } catch {
    return null;
  }
}

/** Streams in behind a skeleton: on a cold instance nuLiga needs several seconds to answer. */
async function LiveGames() {
  const t = await getTranslations("livePage");
  const summary = await loadSummary();
  if (summary === null) {
    return (
      <p
        role="status"
        className="rounded-2xl bg-white p-6 text-center text-muted dark:bg-gray-800 dark:text-gray-300"
      >
        {t("unreachable")}
      </p>
    );
  }

  // The summary's own timestamp, so "upcoming" and "live" agree with each other.
  const now = summary.updatedAt;
  const startOf = (g: LiveGame) => new Date(g.scheduled).getTime();
  const live = summary.games.filter((g) => g.live);
  const upcoming = summary.games.filter((g) => !g.live && startOf(g) > now).slice(0, LIST_LIMIT);
  const finished = summary.games
    .filter((g) => !g.live && startOf(g) <= now)
    .sort((a, b) => startOf(b) - startOf(a))
    .slice(0, LIST_LIMIT);

  return (
    <>
      <LiveGameList title={t("running")} games={live} emptyText={t("noneRunning")} />
      <LiveGameList title={t("next")} games={upcoming} />
      <LiveGameList title={t("last")} games={finished} />
    </>
  );
}

export default async function LivePage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("livePage");
  // Only the cached hero images are awaited here, so the hero paints immediately.
  const slides = await client
    .fetch<SanityImage[]>(pageHeroSlidesQuery, {}, { next: { revalidate: 3600 } })
    .catch(() => [] as SanityImage[]);

  return (
    <>
      <PageHeroSlider
        slides={slides ?? []}
        title={t("title")}
        subtitle={t("heroSubtitle")}
      />
      <section className="bg-background dark:bg-gray-900">
        <div className="mx-auto max-w-3xl space-y-10 px-4 pb-20 pt-6 sm:px-6">
          <Suspense fallback={<LiveListSkeleton />}>
            <LiveGames />
          </Suspense>
          <p className="text-center text-sm text-muted">
            {t.rich("scheduleNote", {
              link: (chunks) => (
                <Link href="/spielplan" className="font-bold text-brand-red underline-offset-4 hover:underline">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </div>
      </section>
    </>
  );
}
