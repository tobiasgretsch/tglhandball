---
name: TG MIPA Landshut Handball
description: Official digital home of TG MIPA Landshut — bold, athletic, community-rooted.
colors:
  match-red: "#da251c"
  match-red-light: "#e64752"
  badge-blue: "#004f9f"
  near-white: "#F8F9FA"
  ink: "#1A1A1A"
  ink-muted: "#6B7280"
  dark-surface: "#111827"
  dark-text: "#f3f4f6"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(3rem, 10vw, 6rem)"
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 3rem)"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(1.125rem, 2.5vw, 1.5rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    letterSpacing: "0.12em"
rounded:
  none: "0px"
  sm: "2px"
  md: "4px"
  lg: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
components:
  button-primary:
    backgroundColor: "{colors.match-red}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "16px 28px"
  button-primary-hover:
    backgroundColor: "{colors.match-red-light}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "16px 28px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "16px 28px"
  card:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
  chip-category:
    backgroundColor: "{colors.badge-blue}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "2px 8px"
---

# Design System: TG MIPA Landshut Handball

## 1. Overview

**Creative North Star: "The Club Crest Standard"**

This design system is built on the logic of a crest badge: every element earns its place, nothing is decorative, and the colors carry the full weight of identity. TG MIPA red and blue are not accents applied to a neutral field — they ARE the field. The system feels proud, structured, and authoritative without becoming corporate or polished. It looks like a real club that takes itself seriously.

Typography is the workhorse. Inter at maximum weight (900, uppercase, tight tracking) does what match-day signage does — it commands attention at a glance. Body copy is clean and functional. The system never reaches for visual tricks to compensate for weak hierarchy.

Motion is used the way a handball referee signals: decisive and purposeful. State transitions (hover, dropdown open/close, drawer slide) use ease-out curves and short durations. Nothing bounces or lingers. Dark mode is a first-class citizen — the header stays in club red and the content area inverts cleanly.

**Key Characteristics:**
- Two-color brand identity used at full commitment — no neutralizing the palette
- Inter black (900) for all display and headline type; Inter regular for body
- Uppercase tracking-widest labels throughout navigation and metadata
- Minimum border-radius everywhere — `rounded-sm` (2px) on interactive elements, `rounded-lg` (8px) on cards
- Elevation via soft shadows (shadow-sm → shadow-md on hover); never decorative glow
- Active nav state: 2px white underline with subtle glow — the only place glowing shadow appears
- Dark mode: header stays red, content surface becomes #111827

## 2. Colors: The Match-Day Palette

Two committed brand colors anchor everything. Neutrals exist only to support legibility.

### Primary
- **Match Red** (#da251c): The dominant brand color. Header background, primary buttons, focus rings, hover text transitions, category call-outs. Never use as a background for small text without verifying 4.5:1 contrast.
- **Match Red Light** (#e64752): Hover state for primary buttons only. Not a general-purpose red.

### Secondary
- **Badge Blue** (#004f9f): The second brand color. Hero section background, accent text labels, secondary accent contexts. Used sparingly relative to Match Red — it grounds; red attacks.

### Neutral
- **Near White** (#F8F9FA): Page body background in light mode. Barely tinted — a near-neutral off-white, not cream or warm.
- **Ink** (#1A1A1A): Primary text in light mode. Near-black, not pure black.
- **Ink Muted** (#6B7280): Secondary text, timestamps, metadata — always on Near White or white backgrounds. Never on tinted surfaces without re-checking contrast.
- **Dark Surface** (#111827): Page body background in dark mode.
- **Dark Text** (#f3f4f6): Primary text in dark mode.

### Named Rules

**The Two-Color Rule.** Every page is built from Match Red, Badge Blue, and neutrals. No third accent color — not emerald, not rose, not amber — unless it is a semantic category signal (news tags use category-specific hues for differentiation). Outside category tags, the palette is closed.

**The No-Neutral-Hero Rule.** Backgrounds for hero sections, headers, and full-bleed sections must use a brand color (Match Red or Badge Blue) or a dark overlay on imagery. A white or gray hero section is prohibited — it reads as an empty template, not a club.

## 3. Typography

**Single Font:** Inter (Google Fonts, Latin subset)

This system uses a single typeface at extreme weight contrast — font-black (900) for display/headlines vs. font-normal (400) for body — rather than pairing two families. The contrast is sufficiently dramatic. Introducing a second family would compete rather than complement.

**Character:** Functional and authoritative. Inter black at tight tracking resembles directional signage inside a sports facility — immediate, unambiguous. Inter regular handles prose without calling attention to itself.

### Hierarchy

- **Display** (900, clamp 3rem–6rem, line-height 0.9, letter-spacing -0.03em): Hero headlines only. UPPERCASE. Pushes to the physical limits of the viewport. Example: "HANDBALL IN LANDSHUT"
- **Headline** (900, clamp 1.75rem–3rem, line-height 1.05, letter-spacing -0.02em): Section headers, news article titles, team headers. May be uppercase or title-case depending on context.
- **Title** (700, clamp 1.125rem–1.5rem, line-height 1.2, letter-spacing -0.01em): Card titles, sidebar headings, widget headers. Title-case.
- **Body** (400, 16px, line-height 1.65): All prose. Max line length 65–75ch. Not uppercase, not tracked.
- **Label** (700, 13px–15px, letter-spacing 0.12em, UPPERCASE): Navigation items, button text, category chips, metadata. The system's workhorse for interface text.

### Named Rules

**The Weight-Contrast Rule.** Display and headline type must be font-black (900). Body must be font-normal (400). Do not use font-semibold (600) or font-medium (500) for either role — the gap between 900 and 400 is the hierarchy. Bridging it with intermediate weights collapses the system.

**The Uppercase-Label Rule.** Labels, nav items, and button text are uppercase with tracking-widest or tracking-[0.12em]. This is a system-wide convention, not a component choice. Sentence-case labels in navigation read as inconsistent.

## 4. Elevation

This system uses **minimal structural shadows** — subtle depth to distinguish elevated surfaces from the page plane, not to decorate. The guiding principle: a surface casts a shadow because it is physically above another surface, not because it needs visual interest.

### Shadow Vocabulary
- **Resting card** (`box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)`): Default card state. Nearly invisible — suggests separation without weight.
- **Hovered card** (`box-shadow: 0 4px 16px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)`): On card hover. Communicates liftability.
- **Dropdown / drawer** (`box-shadow: 0 25px 50px rgba(0,0,0,0.25)`): Menus and the mobile drawer panel. Heavy shadow — they float above the page.
- **Header on scroll** (`box-shadow: 0 2px 24px rgba(0,0,0,0.2)`): Sticky header when scrolled. Separates the nav plane from content.
- **Primary button glow** (`box-shadow: 0 8px 30px rgba(218,37,28,0.3)`): The single exception to the "functional shadows only" rule. A faint red glow under primary buttons matches the brand energy. One place, one purpose.
- **Active nav underline glow** (`text-shadow: 0 0 8px rgba(255,255,255,0.7)` on the 2px underline): The active navigation indicator uses a white line with glow. Not decorative — it marks location in a high-contrast context (white on red).

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only as a response to state change (hover, scroll, modal open). A resting card has shadow-sm; a hovered card has shadow-md. Nothing starts elevated without a reason.

## 5. Components

### Buttons

Clean-edged, uppercase, deliberately small border-radius. They look like physical buttons on scoreboards.

- **Shape:** Nearly square corners (2px, `rounded-sm`). Not pill-shaped. Not perfectly square — just minimal rounding.
- **Primary:** Match Red (#da251c) background, white text, 13px uppercase, tracking-widest (0.12em+), 16px top/bottom × 28px left/right padding. `shadow-lg shadow-primary/30` in the hero context.
- **Primary Hover:** Background shifts to Match Red Light (#e64752). Color transition only — no scale, no movement.
- **Ghost:** Transparent background, white text, `border-2` in white/40 opacity → white on hover. Used in hero context only, always on a dark/colored background.
- **Focus:** 3px solid Match Red outline, 3px offset (`focus-visible`). Visible across all backgrounds.

### Navigation

- **Style:** Fixed header in Match Red (#da251c), 68px tall at rest, shrinks to 60px on scroll with backdrop-blur.
- **Default links:** 15px, font-bold, uppercase, tracking-[0.12em], text-white/75.
- **Active links:** text-white with a 2px white underline (layout-animated via Framer Motion `layoutId`).
- **Dropdowns:** White background (dark: Match Red bg), shadow-2xl, `rounded-sm`. Links inside: 13px, font-bold, uppercase, text-gray-900.
- **Mobile:** Full-height right-side drawer (`w-80`), spring animation (`stiffness: 340, damping: 32`). Links 12px, uppercase, tracking-widest. Collapsible sections with chevron.

### Cards

- **Corner Style:** Gently rounded (8px, `rounded-lg`)
- **Background:** White in light mode; #1f2937 (gray-800) in dark mode.
- **Shadow Strategy:** shadow-sm at rest → shadow-md on hover. Transition 300ms.
- **Border:** 1px border-gray-100 (dark: border-gray-700) — a hair-thin separator at rest.
- **Internal Padding:** 20px (`p-5`)
- **Image:** 16:9 aspect ratio thumbnail with `group-hover:scale-105` (500ms) zoom.
- **"Read more" link:** 11px, uppercase, tracking-wider, text-primary. Arrow gap animates from 1.5px to 2.5px on hover.

### Category Chips

- **Style:** Tiny pill-like badge (4px radius). 10px, font-bold, uppercase, tracking-widest.
- **Color assignment by category:** Herren = Badge Blue tint; Damen = rose; Jugend = emerald; Verein = gray. These are the ONLY places where the color palette opens beyond red and blue — to semantically distinguish news categories at a glance.

### Inputs / Fields

- **Style:** Standard border input, 1px border-gray-300. No fill.
- **Focus:** 3px Match Red outline via `:focus-visible`. Consistent with global focus style.
- **Labels:** Font-bold, uppercase, tracking-wider — consistent with the label hierarchy.

### Signature Component: The Watermark Header Band

The fixed header contains a large typographic watermark (`TG MIPA LANDSHUT` at 72–96px, font-black, text-white/10) that runs behind the nav. Visible only at the top of the page when the header is at full opacity — it fades with the scroll backdrop-blur. This is a deliberate brand move: the club name as environmental signage, not as information.

## 6. Do's and Don'ts

### Do:
- **Do** use Match Red (#da251c) for all primary CTAs, the header background, focus rings, and active-state indicators.
- **Do** use Badge Blue (#004f9f) for hero backgrounds, secondary accents, and the club name logotype sub-mark.
- **Do** set all nav labels, button text, and UI metadata in uppercase with tracking-widest or tracking-[0.12em].
- **Do** use Inter at weight 900 for all display and headline type — the weight-contrast between 900 and 400 is the hierarchy.
- **Do** cap body line length at 65–75ch for readability in prose contexts.
- **Do** use `rounded-sm` (2px) on buttons and interactive chips; `rounded-lg` (8px) on cards and containers.
- **Do** use `prefers-reduced-motion` fallbacks for every Framer Motion animation: instant state changes, no choreography.
- **Do** use `100dvh` (not `100vh`) for any fullscreen section — mobile browser chrome must not crop content.
- **Do** maintain the dark mode header in Match Red — the header never goes gray or neutral in dark mode.

### Don't:
- **Don't** use generic sports SaaS aesthetics: no blue-gradient hero + metric cards, no Wix Sports / GoSportsite template look, no stock-photo athletes against gradient backgrounds.
- **Don't** use cream, sand, parchment, or any warm-neutral body background. The page background is #F8F9FA (nearly chroma-0) in light mode. Warmth comes from the brand colors, not from the background.
- **Don't** introduce a third accent color outside of the category-chip semantic palette (Herren/Damen/Jugend/Verein). The system is a closed two-color identity.
- **Don't** use gradient text (`background-clip: text`). Emphasis is via weight (900 vs 400) and color (Match Red). Never via gradients.
- **Don't** use `border-left` greater than 1px as a colored stripe on cards or callouts. Full borders or background tints only.
- **Don't** use glassmorphism effects except where structurally justified (the header's `backdrop-blur-md` on scroll is load-bearing — it indicates the sticky state).
- **Don't** put an uppercase ALL-CAPS kicker above every section. The `tracking-widest` label convention is reserved for labels, nav, and buttons — not as a reflexive eyebrow on every content section.
- **Don't** use font weights 500 or 600 in display or headline contexts. The system uses 900/700 for UI and 400 for body — intermediate weights collapse the contrast hierarchy.
- **Don't** render dropdown menus inside `overflow: hidden` containers. They must escape their stacking context via `position: absolute` on a non-clipped parent.
