import { client, urlFor } from "@/lib/sanity";
import { settingsQuery, allTeamsQuery } from "@/lib/queries";
import type { Settings, Team } from "@/types";
import HeaderClient from "./HeaderClient";

export default async function Header() {
  const [settings, teams] = await Promise.all([
    client
      .fetch<Settings>(settingsQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => null),
    client
      .fetch<Team[]>(allTeamsQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => [] as Team[]),
  ]);

  const logoUrl = settings?.logo
    ? urlFor(settings.logo).width(88).height(88).url()
    : null;

  const teamItems = (teams ?? []).map((t) => ({
    _id: t._id,
    name: t.name,
    slug: t.slug,
    league: t.league,
  }));

  return (
    <HeaderClient
      logoUrl={logoUrl}
      clubName={settings?.clubName ?? "TG MIPA"}
      teams={teamItems}
    />
  );
}
