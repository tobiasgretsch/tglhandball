import { client } from "@/lib/sanity";
import { allTeamsQuery, latestNewsQuery, settingsQuery } from "@/lib/queries";
import { CLUB_DESCRIPTION, CLUB_NAME, absoluteUrl } from "@/lib/seo";
import type { NewsArticle, Settings, Team } from "@/types";

export const revalidate = 3600;

const MAX_NEWS_ITEMS = 4;

/** Plain-text club summary for AI assistants (llmstxt.org convention). */
export async function GET() {
  const [settings, teams, news] = await Promise.all([
    client.fetch<Settings>(settingsQuery, {}, { next: { revalidate } }).catch(() => null),
    client.fetch<Team[]>(allTeamsQuery, {}, { next: { revalidate } }).catch(() => [] as Team[]),
    client.fetch<NewsArticle[]>(latestNewsQuery, {}, { next: { revalidate } }).catch(() => [] as NewsArticle[]),
  ]);

  const lines: string[] = [
    `# ${CLUB_NAME} Handball`,
    "",
    `> ${CLUB_DESCRIPTION}`,
    "",
    "## Verein",
    `- Name: TG MIPA Landshut (Turngemeinde Landshut, Abteilung Handball)`,
    `- Sportart: Handball`,
    `- Ort: Landshut, Bayern, Deutschland`,
    ...(settings?.venueName && settings.venueAddress
      ? [`- Heimspielstätte: ${settings.venueName}, ${settings.venueAddress.replace(/\n/g, ", ")}`]
      : []),
    ...(settings?.contactEmail ? [`- Kontakt: ${settings.contactEmail}`] : []),
    "",
    "## Wichtige Seiten",
    `- [Spielplan & Ergebnisse](${absoluteUrl("/spielplan")}): alle Spiele, Termine und Ergebnisse`,
    `- [Teams](${absoluteUrl("/teams")}): Mannschaften mit Kader, Trainern und Spielen`,
    `- [Neuigkeiten](${absoluteUrl("/news")}): Spielberichte und Vereinsnews`,
    `- [Über uns](${absoluteUrl("/ueberuns")}): Verein, Vorstand, Kontakt und Anfahrt`,
    `- [Spieltagsmagazin](${absoluteUrl("/spieltagsmagazin")}): Magazine zum Download`,
    `- [Partner](${absoluteUrl("/partner")}): Sponsoren und Unterstützer`,
    `- [Förderverein](${absoluteUrl("/foerderverein")}): Handball in Landshut unterstützen`,
    "",
  ];

  if (teams.length > 0) {
    lines.push("## Mannschaften");
    for (const team of teams) {
      const league = team.league ? ` (${team.league})` : "";
      lines.push(`- [${team.name}](${absoluteUrl(`/teams/${team.slug.current}`)})${league}`);
    }
    lines.push("");
  }

  if (news.length > 0) {
    lines.push("## Aktuelle News");
    for (const article of news.slice(0, MAX_NEWS_ITEMS)) {
      lines.push(`- [${article.title}](${absoluteUrl(`/news/${article.slug.current}`)})`);
    }
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
