import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { groq } from "next-sanity";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { client } from "@/lib/sanity";
import { CLUB_TIME_ZONE } from "@/lib/dates";
import { getArchivedGame } from "@/lib/live/archive";
import { HIGHLIGHT_LABEL, isHighlight } from "@/lib/live/highlights";
import { isValidMeetingId } from "@/lib/live/parse";
import { getTicker } from "@/lib/live/ticker";
import { gamePagePath } from "@/lib/match";
import { DEFAULT_OG_IMAGE, breadcrumbJsonLd, finishedGameJsonLd } from "@/lib/seo";
import type { Match } from "@/types";
import JsonLd from "@/components/ui/JsonLd";
import LiveTicker from "@/components/live/LiveTicker";
import MatchReportButton from "@/components/ui/MatchReportButton";

interface PageProps {
  params: Promise<{ meetingId: string }>;
}

const REVALIDATE_SECONDS = 300;

const dateFormat = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: CLUB_TIME_ZONE,
});

type Neighbour = Pick<Match, "homeTeam" | "awayTeam" | "result" | "meetingId" | "archive">;

interface Context {
  team: { name: string; slug: { current: string } } | null;
  previous: Neighbour | null;
  next: Neighbour | null;
}

const NEIGHBOUR_FIELDS = `homeTeam, awayTeam, result, meetingId, "archive": *[_type == "matchArchive" && meetingId == ^.meetingId][0]{ highlights }`;

/** The team's previous and next fixture, for the "Vorheriges / Nächstes Spiel" links. */
const contextQuery = groq`*[_type == "match" && meetingId == $meetingId][0]{
  "team": team->{ name, slug },
  "previous": *[_type == "match" && team._ref == ^.team._ref && date < ^.date] | order(date desc)[0]{ ${NEIGHBOUR_FIELDS} },
  "next": *[_type == "match" && team._ref == ^.team._ref && date > ^.date] | order(date asc)[0]{ ${NEIGHBOUR_FIELDS} }
}`;

async function loadContext(meetingId: string): Promise<Context> {
  const context = await client
    .fetch<Context | null>(contextQuery, { meetingId }, { next: { revalidate: REVALIDATE_SECONDS } })
    .catch(() => null);
  return context ?? { team: null, previous: null, next: null };
}

/** `null` = not archived; the game may still be inside the live window, which has its own page. */
async function loadGame(meetingId: string) {
  if (!isValidMeetingId(meetingId)) return null;
  return getArchivedGame(meetingId);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { meetingId } = await params;
  const archived = await loadGame(meetingId);
  if (!archived) return { title: "Spielverlauf", robots: { index: false, follow: true } };

  const { game, scoreHome, scoreGuest } = archived.snapshot;
  const title = `${game.homeTeam} – ${game.awayTeam} (${scoreHome}:${scoreGuest})`;
  const description = `Spielverlauf, Torfolge und Statistik: ${game.homeTeam} gegen ${game.awayTeam} endete ${scoreHome}:${scoreGuest}${game.league ? ` (${game.league})` : ""}.`;
  const path = `/spielplan/${meetingId}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    // Youth games name no players, but stay out of search engines all the same.
    robots: archived.indexable ? undefined : { index: false, follow: true },
    openGraph: { title: `${title} | TG MIPA Landshut`, description, type: "website", images: [DEFAULT_OG_IMAGE] },
    twitter: { card: "summary_large_image", images: [DEFAULT_OG_IMAGE.url] },
  };
}

function NeighbourLink({ match, direction }: { match: Neighbour | null; direction: "previous" | "next" }) {
  const href = match ? gamePagePath(match) : null;
  if (!match || !href) return <span />;

  const isPrevious = direction === "previous";
  return (
    <Link
      href={href}
      className={`group flex min-h-11 items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm transition-colors hover:border-primary dark:border-gray-700 dark:bg-gray-800 ${
        isPrevious ? "" : "flex-row-reverse text-right"
      }`}
    >
      {isPrevious ? <ChevronLeft size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
      <span className="min-w-0">
        <span className="block text-[11px] font-bold uppercase tracking-[0.1em] text-muted">
          {isPrevious ? "Vorheriges Spiel" : "Nächstes Spiel"}
        </span>
        <span className="block truncate font-medium text-text dark:text-gray-100">
          {match.homeTeam} – {match.awayTeam}
          {match.result && <span className="ml-1.5 font-black tabular-nums">{match.result}</span>}
        </span>
      </span>
    </Link>
  );
}

export default async function GamePage({ params }: PageProps) {
  const { meetingId } = await params;
  const archived = await loadGame(meetingId);

  if (!archived) {
    // Inside the live window the ticker answers; anything else has no page.
    const live = isValidMeetingId(meetingId) ? await getTicker(meetingId).catch(() => null) : null;
    if (live) redirect(`/live/${meetingId}`);
    notFound();
  }

  const { snapshot, highlights } = archived;
  const { game, scoreHome, scoreGuest } = snapshot;
  const context = await loadContext(meetingId);
  const path = `/spielplan/${meetingId}`;
  const tags = highlights.filter(isHighlight);

  return (
    <section className="bg-background dark:bg-gray-900">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Startseite", path: "/" },
            { name: "Spielplan & Ergebnisse", path: "/spielplan" },
            { name: `${game.homeTeam} – ${game.awayTeam}`, path },
          ]),
          finishedGameJsonLd(game, scoreHome, scoreGuest, path),
        ]}
      />
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6 lg:pt-10">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold uppercase italic tracking-[-0.02em] text-text dark:text-gray-100">
              Spielverlauf
            </h1>
            <p className="text-sm text-muted">{dateFormat.format(new Date(game.scheduled))}</p>
          </div>
          <Link
            href={context.team ? `/spielplan?team=${context.team.slug.current}` : "/spielplan"}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-bold text-brand-red underline-offset-4 hover:underline"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Alle Spiele
          </Link>
        </div>

        {tags.length > 0 && (
          <ul className="mb-4 flex flex-wrap gap-2" aria-label="Besonderheiten dieses Spiels">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-brand-red"
              >
                {HIGHLIGHT_LABEL[tag]}
              </li>
            ))}
          </ul>
        )}

        <LiveTicker meetingId={meetingId} initial={snapshot} />

        <div className="mt-6 flex justify-center">
          <MatchReportButton meetingId={meetingId} />
        </div>

        <nav aria-label="Weitere Spiele" className="mt-8 grid gap-3 sm:grid-cols-2">
          <NeighbourLink match={context.previous} direction="previous" />
          <NeighbourLink match={context.next} direction="next" />
        </nav>
      </div>
    </section>
  );
}
