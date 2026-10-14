import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/seo";
import Image from "next/image";
import { client } from "@/lib/sanity";
import { pageHeroSlidesQuery } from "@/lib/queries";
import {
  SHOP_CATEGORIES,
  SHOP_HOME_URL,
  SHOP_SECTIONS,
  type ShopProduct,
  type ShopSection,
} from "@/lib/fanshop";
import type { SanityImage } from "@/types";
import PageHeroSlider from "@/components/sections/PageHeroSlider";
import Reveal from "@/components/ui/Reveal";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: "/fanshop" },
  title: "Fanshop",
  description:
    "Offizieller Fanshop des TG MIPA Landshut — neue Trikots 26/27, Teamwear, Hallenschuhe und Equipment von uhlsport.",
  openGraph: {
    title: "Fanshop | TG MIPA Landshut",
    description: "Neue Trikotkollektion 26/27 und mehr — zeig deine Vereinsfarben.",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [DEFAULT_OG_IMAGE.url] },
};

export const revalidate = 3600;

const CARD_SHADOW =
  "shadow-[0_1px_2px_rgb(0_0_0/0.06),0_16px_40px_-16px_rgb(0_0_0/0.2)]";
const SHOP_LINK_PROPS = { target: "_blank", rel: "noopener noreferrer" } as const;
const IMAGE_SIZES = "(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw";

function ProductCard({ product }: { product: ShopProduct }) {
  const { name, price, priceFrom, imageUrl, href, badge } = product;
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
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 border-t border-gray-100 p-4 dark:border-gray-700">
        <h3 className="text-sm font-bold leading-snug tracking-[-0.01em] text-text dark:text-gray-100">
          {name}
        </h3>
        <p className="mt-auto pt-1 text-sm text-muted dark:text-gray-400">
          {priceFrom && <span className="text-xs">ab </span>}
          <span className="font-semibold text-text dark:text-gray-100">{price}</span>
        </p>
      </div>
    </a>
  );
}

function ProductSection({ section }: { section: ShopSection }) {
  const { id, eyebrow, title, description, href, linkLabel, products } = section;
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 py-10 md:py-14">
      <Reveal className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary dark:text-primary-glow">
            {eyebrow}
          </p>
          <h2
            id={`${id}-title`}
            className="font-display text-3xl font-bold uppercase italic leading-tight tracking-[-0.02em] text-text dark:text-gray-100 md:text-4xl"
          >
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted dark:text-gray-400 md:text-base">
            {description}
          </p>
        </div>
        <a
          href={href}
          {...SHOP_LINK_PROPS}
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-primary transition-colors hover:text-primary-light dark:text-primary-glow"
        >
          {linkLabel}
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </Reveal>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {products.map((product) => (
          <li key={product.href}>
            <Reveal className="h-full">
              <ProductCard product={product} />
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function FanshopPage() {
  const slides = await client
    .fetch<SanityImage[]>(pageHeroSlidesQuery, {}, { next: { revalidate: 3600 } })
    .catch(() => [] as SanityImage[]);

  return (
    <>
      <PageHeroSlider
        slides={slides ?? []}
        title="Fanshop"
        subtitle="Neue Trikots 26/27, Teamwear, Hallenschuhe und Equipment — alles mit Vereinsfarben."
      />

      <div className="min-h-[60vh] bg-background dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
          {/* Category navigation */}
          <nav aria-label="Shop-Kategorien">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {SHOP_CATEGORIES.map(({ id, title, description, href }, i) => (
                <li key={id}>
                  <Reveal delay={0.04 * i} className="h-full">
                    <a
                      href={href}
                      {...SHOP_LINK_PROPS}
                      className={`group press-card flex h-full flex-col justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 ${CARD_SHADOW}`}
                    >
                      <div>
                        <h2 className="text-base font-bold tracking-[-0.01em] text-text dark:text-gray-100">
                          {title}
                        </h2>
                        <p className="mt-1 text-xs leading-relaxed text-muted dark:text-gray-400">
                          {description}
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
              <li className="col-span-2 sm:col-span-1">
                <Reveal delay={0.04 * SHOP_CATEGORIES.length} className="h-full">
                  <a
                    href={SHOP_HOME_URL}
                    {...SHOP_LINK_PROPS}
                    className={`press-card flex h-full flex-col justify-between gap-3 rounded-2xl bg-primary p-4 text-white ${CARD_SHADOW}`}
                  >
                    <div>
                      <h2 className="text-base font-bold tracking-[-0.01em]">Gesamter Shop</h2>
                      <p className="mt-1 text-xs leading-relaxed text-white/80">
                        Alle Artikel auf einen Blick
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
              <ProductSection key={section.id} section={section} />
            ))}
          </div>

          {/* Closing CTA */}
          <Reveal
            className={`mt-6 flex flex-col gap-4 rounded-2xl bg-primary px-6 py-6 sm:flex-row sm:items-center sm:justify-between ${CARD_SHADOW}`}
          >
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/80">
                Offizieller Club-Shop von uhlsport
              </p>
              <p className="font-display text-2xl font-bold uppercase italic leading-tight tracking-[-0.02em] text-white">
                Noch mehr entdecken
              </p>
            </div>
            <a
              href={SHOP_HOME_URL}
              {...SHOP_LINK_PROPS}
              className="btn press shrink-0 whitespace-nowrap bg-white !text-primary hover:bg-white/90"
            >
              Zum Fanshop
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </Reveal>
        </div>
      </div>
    </>
  );
}
