import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { DEFAULT_OG_IMAGE, localizedAlternates } from "@/lib/seo";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { client, urlFor } from "@/lib/sanity";
import { allTeamsQuery, pageHeroSlidesQuery } from "@/lib/queries";
import type { Team, SanityImage, TeamCategory } from "@/types";
import Reveal from "@/components/ui/Reveal";
import PageHeroSlider from "@/components/sections/PageHeroSlider";

const TEAM_CATEGORIES: readonly TeamCategory[] = ["herren", "damen", "jugend_m", "jugend_w"];

type Props = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "teamsPage" });
  return {
    alternates: localizedAlternates("/teams", locale),
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: t("ogTitle"),
      description: t("metaDescription"),
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: { card: "summary_large_image", images: [DEFAULT_OG_IMAGE.url] },
  };
}

export const revalidate = 3600;

export default async function TeamsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("teamsPage");
  const tCategories = await getTranslations("teamCategories");
  const [teams, slides] = await Promise.all([
    client
      .fetch<Team[]>(allTeamsQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => [] as Team[]),
    client
      .fetch<SanityImage[]>(pageHeroSlidesQuery, {}, { next: { revalidate: 3600 } })
      .catch(() => [] as SanityImage[]),
  ]);

  return (
    <>
      <PageHeroSlider
        slides={slides ?? []}
        title={t("heroTitle")}
      />

      {/* Team sections — grouped by category */}
      <div className="bg-background dark:bg-gray-900">
        {teams.length === 0 ? (
          <p className="text-muted text-center py-16">
            {t("empty")}
          </p>
        ) : (
          <>
            {TEAM_CATEGORIES.map((key) => {
              const groupTeams = teams.filter((t) => t.category === key);
              if (groupTeams.length === 0) return null;
              return (
                <section key={key} id={key} className="py-12 md:py-16">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Reveal>
                      <h2 className="font-display font-bold italic uppercase text-3xl md:text-4xl tracking-[-0.02em] text-text dark:text-gray-100 mb-6">
                        {tCategories(key)}
                      </h2>
                    </Reveal>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                      {groupTeams.map((team) => (
                        <TeamCard key={team._id} team={team} />
                      ))}
                    </div>
                  </div>
                </section>
              );
            })}

            {/* Teams without a category */}
            {teams.filter((t) => !t.category).length > 0 && (
              <section className="py-12 md:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h2 className="font-display font-bold italic uppercase text-3xl md:text-4xl tracking-[-0.02em] text-text dark:text-gray-100 mb-6">
                    {t("others")}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {teams.filter((t) => !t.category).map((team) => (
                      <TeamCard key={team._id} team={team} />
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}

function TeamCard({ team }: { team: Team }) {
  const t = useTranslations("teamsPage");
  const imageUrl = team.headerImage
    ? urlFor(team.headerImage).width(480).height(360).url()
    : null;

  return (
    <Link
      href={`/teams/${team.slug.current}`}
      className="group press-card bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col shadow-[0_1px_2px_rgb(0_0_0/0.05)] hover:shadow-[0_12px_32px_-12px_rgb(0_0_0/0.25)] transition-shadow duration-300"
    >
      {/* Header image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={team.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover motion-safe:group-hover:scale-[1.03] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/15 flex items-center justify-center">
            <span className="font-display font-bold italic text-5xl text-accent/20 select-none">
              TG
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold tracking-[-0.01em] text-text dark:text-gray-100 text-sm md:text-base leading-tight">
          {team.name}
        </h3>
        {team.league && (
          <p className="text-muted text-xs mt-1 leading-snug">{team.league}</p>
        )}
        <div className="mt-auto pt-4">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-primary dark:text-primary-glow uppercase tracking-wider group-hover:gap-2 transition-[gap] duration-200">
            {t("viewTeam")}
            <ArrowRight size={12} aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}
