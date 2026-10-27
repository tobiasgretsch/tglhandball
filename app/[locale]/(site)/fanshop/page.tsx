import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { DEFAULT_OG_IMAGE, localizedAlternates } from "@/lib/seo";
import { LOCALE_TAGS, routing, type Locale } from "@/i18n/routing";
import { currencyFormatter, dateFormatter } from "@/lib/i18n/format";
import { client } from "@/lib/sanity";
import { pageHeroSlidesQuery } from "@/lib/queries";
import {
  PRICES_CHECKED_AT,
  SHOP_CATEGORIES,
  SHOP_HOME_URL,
  SHOP_SECTIONS,
  categoryHref,
  type ShopProduct,
  type ShopSection,
} from "@/lib/fanshop";
import type { SanityImage } from "@/types";
import PageHeroSlider from "@/components/sections/PageHeroSlider";
import Reveal from "@/components/ui/Reveal";
import { ArrowRight, ArrowUpRight } from "lucide-react";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "fanshop" });
  return {
    alternates: localizedAlternates("/fanshop", locale),
    title: t("meta.title"),
    description: t("meta.description"),
    openGraph: {
      title: `${t("meta.title")} | TG MIPA Landshut`,
      description: t("meta.ogDescription"),
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: { card: "summary_large_image", images: [DEFAULT_OG_IMAGE.url] },
  };
}

export const revalidate = 3600;

const CARD_SHADOW =
  "shadow-[0_1px_2px_rgb(0_0_0/0.06),0_16px_40px_-16px_rgb(0_0_0/0.2)]";
const SHOP_LINK_PROPS = { target: "_blank", rel: "noopener noreferrer" } as const;
const IMAGE_SIZES = "(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw";

type ShopTranslator = Awaited<ReturnType<typeof getTranslations<"fanshop">>>;

function ProductCard({ product, t, tag }: { product: ShopProduct; t: ShopTranslator; tag: string }) {
  const { id, price, priceFrom, imageUrl, href, badge } = product;
  const name = t(`products.${id}`);
  return (
    <a
      href={href}
      {...SHOP_LINK_PROPS}
      className={`group press-card flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 ${CARD_SHADOW}`}
    >
      <div className="relative aspect-square bg-white">
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes={IMAGE_SIZES}
          className="object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none"
        />
        {badge && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
            {t(`badges.${badge}`)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 border-t border-gray-100 p-4 dark:border-gray-700">
        <h3 className="text-sm font-bold leading-snug tracking-[-0.01em] text-text dark:text-gray-100">
          {name}
        </h3>
        <p className="mt-auto pt-1 text-sm text-muted">
          {priceFrom && <span className="text-xs">{t("priceFrom")} </span>}
          <span className="font-semibold text-text dark:text-gray-100">
            {currencyFormatter(tag).format(price)}
          </span>
        </p>
      </div>
    </a>
  );
}

function ProductSection({ section, t, tag }: { section: ShopSection; t: ShopTranslator; tag: string }) {
  const { id, links, products } = section;
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 py-10 md:py-14">
      <Reveal className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary dark:text-primary-glow">
            {t(`sections.${id}.eyebrow`)}
          </p>
          <h2
            id={`${id}-title`}
            className="font-display text-3xl font-bold uppercase italic leading-tight tracking-[-0.02em] text-text dark:text-gray-100 md:text-4xl"
          >
            {t(`sections.${id}.title`)}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted md:text-base">
            {t(`sections.${id}.description`)}
          </p>
        </div>
        <ul className="flex shrink-0 flex-wrap gap-x-5 gap-y-2">
          {links.map((categoryId) => (
            <li key={categoryId}>
              <a
                href={categoryHref(categoryId)}
                {...SHOP_LINK_PROPS}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-primary transition-colors hover:text-primary-light dark:text-primary-glow"
              >
                {t(`links.${categoryId}`)}
                <ArrowUpRight size={14} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </Reveal>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {products.map((product) => (
          <li key={product.href}>
            <Reveal className="h-full">
              <ProductCard product={product} t={t} tag={tag} />
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function FanshopPage({ params }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("fanshop");
  const tag = LOCALE_TAGS[(await getLocale()) as Locale];
  const pricesCheckedAt = dateFormatter(tag, { month: "long", year: "numeric" }).format(
    new Date(PRICES_CHECKED_AT),
  );

  const slides = await client
    .fetch<SanityImage[]>(pageHeroSlidesQuery, {}, { next: { revalidate: 3600 } })
    .catch(() => [] as SanityImage[]);

  return (
    <>
      <PageHeroSlider slides={slides ?? []} title={t("hero.title")} subtitle={t("hero.subtitle")} />

      <div className="min-h-[60vh] bg-background dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
          {/* Category navigation */}
          <nav aria-label={t("nav.ariaLabel")}>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {SHOP_CATEGORIES.map(({ id, href }, i) => (
                <li key={id}>
                  <Reveal delay={0.04 * i} className="h-full">
                    <a
                      href={href}
                      {...SHOP_LINK_PROPS}
                      className={`group press-card flex h-full flex-col justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 ${CARD_SHADOW}`}
                    >
                      <div>
                        <h2 className="text-base font-bold tracking-[-0.01em] text-text dark:text-gray-100">
                          {t(`categories.${id}.title`)}
                        </h2>
                        <p className="mt-1 text-xs leading-relaxed text-muted">
                          {t(`categories.${id}.description`)}
                        </p>
                      </div>
                      <ArrowRight
                        size={16}
                        aria-hidden="true"
                        className="text-primary transition-transform group-hover:translate-x-1 dark:text-primary-glow motion-reduce:transition-none"
                      />
                    </a>
                  </Reveal>
                </li>
              ))}
              <li className="col-span-2 sm:col-span-3 lg:col-span-2">
                <Reveal delay={0.04 * SHOP_CATEGORIES.length} className="h-full">
                  <a
                    href={SHOP_HOME_URL}
                    {...SHOP_LINK_PROPS}
                    className={`press-card flex h-full flex-col justify-between gap-3 rounded-2xl bg-primary p-4 text-white ${CARD_SHADOW}`}
                  >
                    <div>
                      <h2 className="text-base font-bold tracking-[-0.01em]">{t("allShop.title")}</h2>
                      <p className="mt-1 text-xs leading-relaxed text-white/80">
                        {t("allShop.description")}
                      </p>
                    </div>
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                </Reveal>
              </li>
            </ul>
          </nav>

          {/* Product sections */}
          <div className="mt-6 divide-y divide-gray-200 dark:divide-gray-800">
            {SHOP_SECTIONS.map((section) => (
              <ProductSection key={section.id} section={section} t={t} tag={tag} />
            ))}
          </div>

          <p className="mt-2 text-xs text-muted">{t("priceNote", { date: pricesCheckedAt })}</p>

          {/* Closing CTA */}
          <Reveal
            className={`mt-6 flex flex-col gap-4 rounded-2xl bg-primary px-6 py-6 sm:flex-row sm:items-center sm:justify-between ${CARD_SHADOW}`}
          >
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/80">
                {t("cta.eyebrow")}
              </p>
              <p className="font-display text-2xl font-bold uppercase italic leading-tight tracking-[-0.02em] text-white">
                {t("cta.title")}
              </p>
            </div>
            <a
              href={SHOP_HOME_URL}
              {...SHOP_LINK_PROPS}
              className="btn press shrink-0 whitespace-nowrap bg-white !text-primary hover:bg-white/90"
            >
              {t("cta.button")}
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </Reveal>
        </div>
      </div>
    </>
  );
}
