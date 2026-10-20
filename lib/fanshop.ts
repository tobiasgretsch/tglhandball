/**
 * Static catalogue for the uhlsport club shop (https://clubshop.uhlsport.com/tg-landshut/).
 * Colour variants of the same article are collapsed into one teaser; the product
 * link opens the article in the shop where all colours/sizes can be chosen.
 * The shop always preselects a size, so apparel links point at the size-M variant
 * rather than whatever variant the shop treats as default (often 5XL or a kids' size).
 */

const SHOP_ORIGIN = "https://clubshop.uhlsport.com/tg-landshut";
const MEDIA_ORIGIN = "https://srv3a.sw6uhlsport-clubshops.gbc.systems/media";

export const SHOP_HOME_URL = `${SHOP_ORIGIN}/`;

/** Month the prices below were last checked against the live shop. */
export const PRICES_CHECKED_AT = "Oktober 2026";

export interface ShopProduct {
  name: string;
  /** Display price, e.g. "46,50 €". */
  price: string;
  /** True when the price is a starting price ("ab"). */
  priceFrom: boolean;
  imageUrl: string;
  href: string;
  /** Optional small label on the card. */
  badge?: string;
}

type ShopCategoryId =
  | "herren"
  | "damen"
  | "schiedsrichter"
  | "freizeit"
  | "baelle-schuhe"
  | "equipment";

interface ShopCategory {
  id: ShopCategoryId;
  title: string;
  description: string;
  href: string;
}

export interface ShopLink {
  label: string;
  href: string;
}

export interface ShopSection {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  /** Links to the matching shop categories. */
  links: ShopLink[];
  products: ShopProduct[];
}

const media = (path: string): string => `${MEDIA_ORIGIN}/${path}`;
const item = (path: string): string => `${SHOP_ORIGIN}/${path}`;

// The shop's "Jugend" category is a copy of "Herren" (same adult items, which
// come in kids' sizes), so it is deliberately not linked.
const CATEGORY_HREFS: Record<ShopCategoryId, string> = {
  herren: `${SHOP_ORIGIN}/8d2af6673f3a4a2586969d22cc5477bd/Herren/`,
  damen: `${SHOP_ORIGIN}/b52e2d82859f4e18868c1829ec08e41d/Damen/`,
  schiedsrichter: `${SHOP_ORIGIN}/470168ca086545f9bab2b2bf7bbcde3b/Schiedsrichter/`,
  freizeit: `${SHOP_ORIGIN}/ec468ea902f744838e025487d2dfa41f/Freizeit-Training/`,
  "baelle-schuhe": `${SHOP_ORIGIN}/6b489e76c4c14dd0aa17d605bdbe34ff/Baelle-Schuhe/`,
  equipment: `${SHOP_ORIGIN}/32dd2248e22743bb9ba579a34e708ed0/Equipment/`,
};

export const SHOP_CATEGORIES: ShopCategory[] = [
  {
    id: "herren",
    title: "Herren",
    description: "Trikots, Warm-ups und Teamwear — auch in Kindergrößen",
    href: CATEGORY_HREFS.herren,
  },
  {
    id: "damen",
    title: "Damen",
    description: "Trikots, Shorts und Teamwear",
    href: CATEGORY_HREFS.damen,
  },
  {
    id: "schiedsrichter",
    title: "Schiedsrichter",
    description: "Trikots und Shorts für die Referees",
    href: CATEGORY_HREFS.schiedsrichter,
  },
  {
    id: "freizeit",
    title: "Freizeit & Training",
    description: "Hoodies, Jacken und Westen",
    href: CATEGORY_HREFS.freizeit,
  },
  {
    id: "baelle-schuhe",
    title: "Bälle & Schuhe",
    description: "Hallenschuhe und Spielbälle",
    href: CATEGORY_HREFS["baelle-schuhe"],
  },
  {
    id: "equipment",
    title: "Equipment",
    description: "Harz, Taschen und Zubehör",
    href: CATEGORY_HREFS.equipment,
  },
];

const HERREN_LINK: ShopLink = { label: "Herren-Artikel", href: CATEGORY_HREFS.herren };
const DAMEN_LINK: ShopLink = { label: "Damen-Artikel", href: CATEGORY_HREFS.damen };

const NEW_SEASON_BADGE = "26/27";

export const SHOP_SECTIONS: ShopSection[] = [
  {
    id: "kollektion",
    eyebrow: "Neu in der Saison 26/27",
    title: "Die TGL-Kollektion",
    description:
      "Heim- und Auswärtstrikots, Torwartdress und Warm-up-Shirts — das offizielle Spieltags-Outfit unserer Teams.",
    links: [HERREN_LINK, DAMEN_LINK],
    products: [
      {
        name: "Heimtrikot Herren",
        price: "46,50 €",
        priceFrom: false,
        imageUrl: media("78/a2/b8/1788783193/Heimtrikot%20Herren.png?ts=1788783193"),
        href: item("Heimtrikot-Herren-26-27-5079-15/SW10010.M"),
        badge: NEW_SEASON_BADGE,
      },
      {
        name: "Auswärtstrikot Herren",
        price: "46,50 €",
        priceFrom: false,
        imageUrl: media("59/d1/ef/1786532511/Heimtrikotwei.png?ts=1786532511"),
        href: item("Auswaertstrikot-Herren-26-27-5079-15/SW10009.M"),
        badge: NEW_SEASON_BADGE,
      },
      {
        name: "Heimtrikot Damen",
        price: "46,50 €",
        priceFrom: false,
        imageUrl: media("21/c9/9b/1788785947/Heimtrikot%20Damen.png?ts=1788785947"),
        href: item("Heimtrikot-Damen-26-27-5079-18/SW10018.M"),
        badge: NEW_SEASON_BADGE,
      },
      {
        // The shop lists this article as "Auswärtstrikot Herren26/27 (5079_20)",
        // but it is the women's away shirt (it sits in the Damen category).
        name: "Auswärtstrikot Damen",
        price: "46,50 €",
        priceFrom: false,
        imageUrl: media("c3/57/ff/1788786053/Auwrtstrikot%20Damen%2026-27.png?ts=1788786053"),
        href: item("Auswaertstrikot-Herren26-27-5079-20/SW10019.M"),
        badge: NEW_SEASON_BADGE,
      },
      {
        name: "Torwart Heimtrikot",
        price: "51,00 €",
        priceFrom: false,
        imageUrl: media("ff/g0/g0/1788784792/TW%20Trikot%20blau.png?ts=1788784792"),
        href: item("TW-Heimtrikot-26-27-5079-7/SW10013.M"),
        badge: NEW_SEASON_BADGE,
      },
      {
        name: "Torwart Auswärtstrikot",
        price: "51,00 €",
        priceFrom: false,
        imageUrl: media("16/9d/8f/1788785330/TW%20Trikot%20gelb.png?ts=1788785330"),
        href: item("TW-Auswaertstrikot-26-27-5079-8/SW10014.M"),
        badge: NEW_SEASON_BADGE,
      },
      {
        name: "Short Herren",
        price: "34,00 €",
        priceFrom: false,
        imageUrl: media("a3/42/e9/1788783387/Short%20Herren.png?ts=1788783387"),
        href: item("Short-Herren-26-27-5079-16/SW10011.M"),
        badge: NEW_SEASON_BADGE,
      },
      {
        name: "Short Damen",
        price: "34,00 €",
        priceFrom: false,
        imageUrl: media("66/fe/df/1788783557/Short%20Damen.png?ts=1788783557"),
        href: item("Short-Damen-26-27-5079-19/SW10012.M"),
        badge: NEW_SEASON_BADGE,
      },
      {
        name: "Warm-up X-Lite",
        price: "34,00 €",
        priceFrom: false,
        imageUrl: media("85/c4/81/1788783147/X-Lite%20Aufwrmshirt%2026-27.png?ts=1788783147"),
        href: item("Warm-up-X-Lite-Herren-26-27-5079-11/SW10008.M"),
        badge: NEW_SEASON_BADGE,
      },
      {
        name: "Warm-up X-Lite Langarm",
        price: "38,00 €",
        priceFrom: false,
        imageUrl: media("bc/ae/e5/1788785370/X-Lite%20Aufwrmshirt%20lang%2026-27.png?ts=1788785370"),
        href: item("Warm-up-Langarm-X-Lite-Herrren-26-27-5079-13/SW10016.M"),
        badge: NEW_SEASON_BADGE,
      },
      {
        name: "Warm-up X-Lite „Dr. Nick“",
        price: "38,00 €",
        priceFrom: false,
        imageUrl: media("be/41/2e/1788785697/Aufwrm%20Dr.-Nick.png?ts=1788785697"),
        href: item("Warm-up-X-Lite-Dr.-Nick-26-27-5079-9/SW10017.M"),
        badge: NEW_SEASON_BADGE,
      },
      {
        name: "Abteilungsshirt X-Lite",
        price: "34,00 €",
        priceFrom: false,
        imageUrl: media("2e/72/94/1788785073/Abteilungsshirt%20X-Lite%2026-27.png?ts=1788785073"),
        href: item("Abteilungsshirt-X-Lite-26-27-5079-10/SW10015.M"),
        badge: NEW_SEASON_BADGE,
      },
    ],
  },
  {
    id: "teamwear",
    eyebrow: "Herren · Damen · Jugend",
    title: "Training & Teamwear",
    description:
      "Polos, Shirts, Shorts und Trainingshosen von uhlsport — für jede Einheit und für den Weg zur Halle.",
    links: [HERREN_LINK, DAMEN_LINK],
    products: [
      {
        name: "Team T-Shirt",
        price: "16,39 €",
        priceFrom: true,
        imageUrl: media("a6/95/b7/1782812316/01069a4ce1a54b4483ee1befd00d093c.jpg?ts=1782812316"),
        href: item("TEAM-T-SHIRT/431-CP01-000000000200209102-M-A"),
      },
      {
        name: "Emotion 27 Shirt",
        price: "19,99 €",
        priceFrom: true,
        imageUrl: media("b9/f0/ee/1782809807/68114931ef0448e3be920043575481d4.jpg?ts=1791398483"),
        href: item("Emotion-27-Shirt/431-CP01-000000000200512361-M-A"),
      },
      {
        name: "Emotion 27 Shirt Damen",
        price: "22,99 €",
        priceFrom: true,
        imageUrl: media("29/41/43/1782810609/04c8283b9e2840198d3f933b831f4f0e.jpg?ts=1791398578"),
        href: item("Emotion-27-Shirt-Damen/431-CP01-000000000200512461-M-A"),
      },
      {
        name: "Emotion 27 Langarmshirt",
        price: "31,99 €",
        priceFrom: true,
        imageUrl: media("20/92/56/1782811426/698bfde890a546e3b9de469596070bac.jpg?ts=1791398607"),
        href: item("Emotion-27-Langarmshirt/431-CP01-000000000200512750-M-A"),
      },
      {
        name: "Classic Polo Shirt",
        price: "25,99 €",
        priceFrom: true,
        imageUrl: media("44/da/24/1782812803/34c55376bc174343af8a6d5b277574fe.jpg?ts=1791398701"),
        href: item("Classic-Polo-Shirt/431-CP01-000000000200515416-M-A"),
      },
      {
        name: "Classic Polo Shirt Damen",
        price: "28,99 €",
        priceFrom: true,
        imageUrl: media("61/e9/b7/1782813153/4986e2e9e28c4c588a03e2d57600ae79.jpg?ts=1791398763"),
        href: item("Classic-Polo-Shirt-Damen/431-CP01-000000000200515701-M-A"),
      },
      {
        name: "1/4 Zip Top",
        price: "31,99 €",
        priceFrom: true,
        imageUrl: media("ca/2a/de/1791206565/edb66e2ea1834fc18972e4c0f23c5df9.jpg?ts=1791398429"),
        href: item("1-4-Zip-Top/431-CP01-000000000200235231-M-A"),
      },
      {
        name: "Team Shorts",
        price: "14,79 €",
        priceFrom: true,
        imageUrl: media("ee/a9/53/1782810929/69e68bff1e554b8b90b9fb095d4e70ae.jpg?ts=1791398532"),
        href: item("Team-Shorts/431-CP01-000000000200588560-M-A"),
      },
      {
        name: "Team Shorts Damen",
        price: "15,99 €",
        priceFrom: true,
        imageUrl: media("4d/8e/ff/1782811252/600f6e4fcd45463a9169c610f1a2e31e.jpg?ts=1791398911"),
        href: item("Team-Shorts-Damen/431-CP01-000000000200588660-M-A"),
      },
      {
        name: "Pocket Shorts",
        price: "20,99 €",
        priceFrom: true,
        imageUrl: media("52/62/07/1782814327/57a83ddda98648d6a5a0fd5872d77870.jpg?ts=1782814327"),
        href: item("POCKET-SHORTS/431-CP01-000000000200310801-M-A"),
      },
      {
        name: "Lite Trainingshose",
        price: "20,99 €",
        priceFrom: true,
        imageUrl: media("d6/80/56/1782814451/868414d12c9c469ea49728ad008d521f.jpg?ts=1782814542"),
        href: item("LITE-TRAININGSHOSE/431-CP01-000000000200362601-M-A"),
      },
      {
        name: "Lite Trainingshose Damen",
        price: "24,99 €",
        priceFrom: true,
        imageUrl: media("0f/21/35/1782814522/fe03cf9aa1044a1ca557882f2b26c3df.jpg?ts=1782814522"),
        href: item("LITE-TRAININGSHOSE-WOMEN/431-CP01-000000000200362801-M-A"),
      },
      {
        name: "Sweathose",
        price: "30,99 €",
        priceFrom: true,
        imageUrl: media("56/ef/87/1782814656/7be8384929694f8d90cd3d230dd8329f.jpg?ts=1782814656"),
        href: item("SWEATHOSE/431-CP01-000000000200588401-M-A"),
      },
    ],
  },
  {
    id: "freizeit",
    eyebrow: "Freizeit & Training",
    title: "Hoodies, Jacken & Westen",
    description: "Warm eingepackt an der Seitenlinie — vom Hoodie bis zur Winterjacke.",
    links: [{ label: "Alle Freizeit-Artikel", href: CATEGORY_HREFS.freizeit }],
    products: [
      {
        name: "Hoodie",
        price: "32,00 €",
        priceFrom: true,
        imageUrl: media("e0/ca/92/1782906004/de08f07fbf404a30876d34c15a241766.jpg?ts=1782906004"),
        href: item("Hoodie/431-CP01-000000000200367001-M-A"),
      },
      {
        name: "Basic Weste",
        price: "44,00 €",
        priceFrom: true,
        imageUrl: media("b8/77/d8/1782907004/3b4eafdf804841ea9a31fe2439f503d7.jpg?ts=1791398856"),
        href: item("Basic-Weste/431-CP01-000000000200515801-M-A"),
      },
      {
        name: "Basic Weste Damen",
        price: "47,00 €",
        priceFrom: true,
        imageUrl: media("d7/4d/cf/1782907098/9f12e791ecc44816b43dde83f7df3dc8.jpg?ts=1791398878"),
        href: item("Basic-Weste-Damen/431-CP01-000000000200515901-M-A"),
      },
      {
        name: "Regenjacke",
        price: "35,00 €",
        priceFrom: true,
        imageUrl: media("b3/13/70/1782906897/ccdbe7ec204a4d74adb0bd66a0f6b698.jpg?ts=1782906897"),
        href: item("Regenjacke/431-CP01-000000000200367501-M-A"),
      },
      {
        name: "Puffer Kapuzenjacke",
        price: "72,00 €",
        priceFrom: true,
        imageUrl: media("62/1c/c9/1782906603/f67d781acc8f4ebdac2441308c6e6655.jpg?ts=1782906603"),
        href: item("Puffer-Kapuzenjacke/431-CP01-000000000200367401-M-A"),
      },
      {
        name: "Winterjacke",
        price: "148,00 €",
        priceFrom: true,
        imageUrl: media("6a/2d/5e/1782906755/ebb9cd79210a4c4fa6fb83e0ac1cd1fb.jpg?ts=1782906755"),
        href: item("WINTERJACKE/431-CP01-000000000200365301-M-A"),
      },
      {
        // 8,39 € is the kids' price; adult sizes cost more.
        name: "Promo T-Shirt",
        price: "8,39 €",
        priceFrom: true,
        imageUrl: media("b7/83/g0/1782811776/26268994324142c0a31d46d5c45df932.jpg?ts=1782811776"),
        href: item("PROMO-T-SHIRT/431-000000000200209207-M-A"),
      },
    ],
  },
  {
    id: "baelle-schuhe",
    eyebrow: "Bälle & Schuhe",
    title: "Hallenschuhe & Spielbälle",
    description:
      "Eine Auswahl: Kourtfly-Hallenschuhe für Damen, Herren und Kids sowie Trainings- und Spielbälle. Im Shop gibt es außerdem Kempa-Wing-Schuhe und Spectrum-Synergy-Bälle.",
    links: [{ label: "Alle Bälle & Schuhe", href: CATEGORY_HREFS["baelle-schuhe"] }],
    products: [
      {
        name: "Kourtfly",
        price: "96,00 €",
        priceFrom: false,
        imageUrl: media("5c/e4/a5/1782223884/e11be55b325a44e2a1f8652a51d2e7de.jpg?ts=1791397041"),
        href: item("Kourtfly/431-000000000200867206-10.5-A"),
      },
      {
        name: "Kourtfly Damen",
        price: "96,00 €",
        priceFrom: false,
        imageUrl: media("d1/6d/2f/1782223887/59aa6e7b62c542d0b089f54be98ff175.jpg?ts=1786370755"),
        href: item("Kourtfly-Damen/431-000000000200867306-10-A"),
      },
      {
        name: "Kourtfly Mid",
        price: "108,00 €",
        priceFrom: false,
        imageUrl: media("3a/81/ed/1782223941/a03a8f12f06f47a69b3dc094513c4ac1.jpg?ts=1791397381"),
        href: item("Kourtfly-Mid/431-000000000200868901-10.5-A"),
      },
      {
        name: "Kourtfly Two",
        price: "72,00 €",
        priceFrom: false,
        imageUrl: media("94/3b/4e/1782223899/be0306702e334c7c96de70855e6c3abe.jpg?ts=1786370768"),
        href: item("Kourtfly-Two/431-000000000200867403-10.5-A"),
      },
      {
        name: "Kourtfly Three",
        price: "48,00 €",
        priceFrom: false,
        imageUrl: media("f0/3d/d9/1782223911/f7dec9878a8143d99737addac7c239cc.jpg?ts=1786370781"),
        href: item("Kourtfly-Three/431-000000000200867604-10.5-A"),
      },
      {
        name: "Kourtfly Jr",
        price: "39,00 €",
        priceFrom: false,
        imageUrl: media("2b/e8/8e/1782223933/8be052387c784aa8a56ee649bd6ae36c.jpg?ts=1786370804"),
        href: item("Kourtfly-Jr/431-000000000200868206-34-A"),
        badge: "Jugend",
      },
      {
        name: "Kourtfly Kids",
        price: "36,00 €",
        priceFrom: false,
        imageUrl: media("65/a9/1e/1782223920/6eeebd8a455f418cb2786558f8973a83.jpg?ts=1791397845"),
        href: item("Kourtfly-Kids/431-000000000200868112-28-A"),
        badge: "Kids",
      },
      {
        name: "Buteo",
        price: "36,00 €",
        priceFrom: false,
        imageUrl: media("c1/9e/b4/1782908126/6a338536f8e146bb98c1b62514f01ed7.jpg?ts=1782908126"),
        href: item("Buteo/431-000000000200191901-2-AN"),
      },
      {
        name: "Gecko",
        price: "24,00 €",
        priceFrom: false,
        imageUrl: media("2d/f4/91/1782908303/1d026b135078437eb75601e631a619b1.jpg?ts=1782908303"),
        href: item("Gecko/431-000000000200192101-0-AN"),
      },
      {
        name: "Leo",
        price: "15,00 €",
        priceFrom: false,
        imageUrl: media("27/49/32/1782908499/5d81fb2b746547d6b781bf8bc8f716e9.jpg?ts=1782908499"),
        href: item("Leo/431-000000000200192203-0-AN"),
      },
    ],
  },
  {
    id: "equipment",
    eyebrow: "Equipment",
    title: "Zubehör für Training & Spieltag",
    description: "Harz, Balltaschen, Schweißbänder und Trolleys — alles, was in die Tasche gehört.",
    links: [{ label: "Alles Equipment", href: CATEGORY_HREFS.equipment }],
    products: [
      {
        name: "Handballharz 200 ml",
        price: "16,80 €",
        priceFrom: false,
        imageUrl: media("5d/a8/1e/1782907541/510644b2ecbd4e1d9d5dcbc090ae9da6.jpg?ts=1782907541"),
        href: item("HANDBALLHARZ-200-ML/431-000000000200158302"),
      },
      {
        name: "Handballharz 500 ml",
        price: "33,00 €",
        priceFrom: false,
        imageUrl: media("5c/38/fa/1782907585/305b94fc1dd94adca64b82434bf36084.jpg?ts=1782907585"),
        href: item("HANDBALLHARZ-500-ML/431-000000000200158402"),
      },
      {
        name: "Balltasche für 1 Ball",
        price: "10,00 €",
        priceFrom: true,
        imageUrl: media("15/30/f4/1782907460/cabfe0d155454b8bbbcada6c36133989.jpg?ts=1782907460"),
        href: item("Balltasche-fuer-1-Ball/431-CP01-000000000200494101"),
      },
      {
        name: "Schweißband (1 Paar)",
        price: "7,79 €",
        priceFrom: false,
        imageUrl: media("e3/cd/fd/1782907742/c841b847c9954d739c033875fe453fa9.jpg?ts=1782907742"),
        href: item("Schweissband-1-Paar/431-000000000200581504"),
      },
      {
        name: "Suspensorium",
        price: "15,00 €",
        priceFrom: false,
        imageUrl: media("ab/ec/15/1782907796/9f29cd7f0411499a9c8c209564f0b345.jpg?ts=1782907796"),
        href: item("SUSPENSORIUM/431-000000000200663101-M-A"),
      },
      {
        name: "Trolley 60 L",
        price: "58,00 €",
        priceFrom: true,
        imageUrl: media("60/de/25/1782907310/88cc9c1f88eb4243aa7451845e57e510.jpg?ts=1782907310"),
        href: item("TROLLEY-60L/431-CP01-000000000200493201"),
      },
    ],
  },
  {
    id: "schiedsrichter",
    eyebrow: "Schiedsrichter",
    title: "Referee-Ausstattung",
    description: "Trikots in vier Farben und passende Shorts für unsere Schiedsrichter.",
    links: [{ label: "Alle Schiedsrichter-Artikel", href: CATEGORY_HREFS.schiedsrichter }],
    products: [
      {
        name: "Schiedsrichter Trikot Schwarz",
        price: "36,00 €",
        priceFrom: false,
        imageUrl: media("7a/07/2d/1782813536/1e08351b23634aaf9469119c2e1ec3e5.jpg?ts=1782813536"),
        href: item("SCHIEDSRICHTER-TRIKOT/431-000000000200310101-M-A"),
      },
      {
        name: "Schiedsrichter Trikot Blau",
        price: "36,00 €",
        priceFrom: false,
        imageUrl: media("02/38/be/1782813529/f555caa9e16143f3aca460d690909e5b.jpg?ts=1782813529"),
        href: item("SCHIEDSRICHTER-TRIKOT/431-000000000200310102-M-A"),
      },
      {
        name: "Schiedsrichter Trikot Grau",
        price: "36,00 €",
        priceFrom: false,
        imageUrl: media("7b/94/02/1782813532/74ea2f35d5fd49b689fcbb9c241b79d4.jpg?ts=1782813532"),
        href: item("SCHIEDSRICHTER-TRIKOT/431-000000000200310103-M-A"),
      },
      {
        name: "Schiedsrichter Trikot Grün",
        price: "36,00 €",
        priceFrom: false,
        imageUrl: media("ae/7f/2e/1782813534/59be3ea3123e4d06947494667dbea155.jpg?ts=1782813534"),
        href: item("SCHIEDSRICHTER-TRIKOT/431-000000000200310104-M-A"),
      },
      {
        name: "Schiedsrichter Shorts",
        price: "24,00 €",
        priceFrom: false,
        imageUrl: media("40/fc/05/1782813531/dc4e1bc31c064cda8dd8173eaefa127d.jpg?ts=1782813531"),
        href: item("SCHIEDSRICHTER-SHORTS/431-000000000200310201-M-A"),
      },
    ],
  },
];
