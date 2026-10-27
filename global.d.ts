import type { routing } from "@/i18n/routing";
import type core from "./messages/de/core.json";
import type layout from "./messages/de/layout.json";
import type home from "./messages/de/home.json";
import type news from "./messages/de/news.json";
import type teams from "./messages/de/teams.json";
import type spielplan from "./messages/de/spielplan.json";
import type live from "./messages/de/live.json";
import type about from "./messages/de/about.json";
import type foerderverein from "./messages/de/foerderverein.json";
import type partner from "./messages/de/partner.json";
import type fanshop from "./messages/de/fanshop.json";
import type gallery from "./messages/de/gallery.json";
import type magazine from "./messages/de/magazine.json";
import type legal from "./messages/de/legal.json";

type Source = typeof core &
  typeof layout &
  typeof home &
  typeof news &
  typeof teams &
  typeof spielplan &
  typeof live &
  typeof about &
  typeof foerderverein &
  typeof partner &
  typeof fanshop &
  typeof gallery &
  typeof magazine &
  typeof legal;

// Typed keys: `t("…")` is checked against messages/de/*.json, the source of truth.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: Source;
  }
}
