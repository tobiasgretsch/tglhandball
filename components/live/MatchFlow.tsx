"use client";

import { useEffect, useId, useState, type PointerEvent } from "react";
import { isClubTeam } from "@/lib/live/fixture";
import { formatGameClock } from "@/lib/live/events";
import {
  assignLanes,
  axisTicksMinutes,
  buildLeadSteps,
  chartLengthSeconds,
  eventCategory,
  leadAxisValues,
  stepAt,
  type EventCategory,
  type LeadStep,
} from "@/lib/live/flow";
import type { TeamSide, TickerEntry, TickerSnapshot } from "@/lib/live/types";

const SECONDS_PER_MINUTE = 60;
/** SVG user units; the graph is stretched to the container, so only the ratios matter. */
const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 100;
const ZERO_Y = VIEW_HEIGHT / 2;
/** Share of the half-height the largest lead may use, so the peak does not touch the edge. */
const PEAK_FILL = 0.92;
const MIN_LEAD_SCALE = 3;
/** Units the home half reaches below zero, so a level score draws one clean home-coloured line instead of a red/blue blend. */
const ZERO_LINE_BIAS = 2;
const DOT_PX = 22;
const DOT_GAP_PX = 3;
/** Width assumed before the chart has been measured (and on the server). */
const FALLBACK_WIDTH_PX = 700;

/** Class names are spelled out so Tailwind can see them. */
const TONES = {
  club: { fill: "fill-primary", stroke: "stroke-primary", bg: "bg-primary", ring: "ring-primary", text: "text-primary dark:text-primary-glow" },
  opponent: {
    fill: "fill-accent dark:fill-accent-sky",
    stroke: "stroke-accent dark:stroke-accent-sky",
    bg: "bg-accent dark:bg-accent-sky",
    ring: "ring-accent dark:ring-accent-sky",
    text: "text-accent dark:text-accent-sky",
  },
} as const;
type Tone = (typeof TONES)[keyof typeof TONES];

const CATEGORY_LABEL: Record<EventCategory, string> = {
  goals: "Tore",
  penalties: "Strafen",
  timeouts: "Auszeiten",
  other: "Sonstige",
};
const CATEGORY_ORDER: EventCategory[] = ["goals", "penalties", "timeouts", "other"];
const CATEGORY_SWATCH: Record<EventCategory, string> = {
  goals: "bg-gradient-to-r from-primary to-accent",
  penalties: "bg-amber-400",
  timeouts: "bg-gray-400",
  other: "bg-gray-300 dark:bg-gray-500",
};

type Layout = "together" | "split";

function useElementWidth(el: HTMLElement | null): number {
  const [width, setWidth] = useState(FALLBACK_WIDTH_PX);
  useEffect(() => {
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width || FALLBACK_WIDTH_PX));
    observer.observe(el);
    return () => observer.disconnect();
  }, [el]);
  return width;
}

/** How far (SVG units) the curve takes to ease from one lead to the next; the lead is flat in between. */
const EASE_UNITS = 16;

/** Smooth step line of the lead over time: flat between goals, an eased S-curve at each one. */
function leadLine(steps: LeadStep[], endSecond: number, length: number, scale: number): string {
  const x = (second: number) => (second / length) * VIEW_WIDTH;
  const y = (lead: number) => ZERO_Y - (lead / scale) * ZERO_Y * PEAK_FILL;
  let d = `M0,${ZERO_Y}`;
  let prevX = 0;
  let prevY = ZERO_Y;
  for (const step of steps.slice(1)) {
    const sx = x(step.second);
    const sy = y(step.lead);
    const ease = Math.min(EASE_UNITS, sx - prevX);
    const start = sx - ease;
    d += ` H${start.toFixed(2)} C${(start + ease / 2).toFixed(2)},${prevY.toFixed(2)} ${(start + ease / 2).toFixed(2)},${sy.toFixed(2)} ${sx.toFixed(2)},${sy.toFixed(2)}`;
    prevX = sx;
    prevY = sy;
  }
  return `${d} H${x(endSecond).toFixed(2)}`;
}

function EventDot({ entry, tone, label }: { entry: TickerEntry; tone: Tone; label: string }) {
  const base = "flex items-center justify-center rounded-full text-[10px] font-black leading-none";
  const category = eventCategory(entry.kind);
  if (category === "goals") return <span className={`${base} size-full ${tone.bg}`} title={label} />;
  if (category === "penalties") {
    return (
      <span className={`${base} size-full bg-amber-400 text-gray-900 ring-2 ${tone.ring}`} title={label}>
        {entry.kind === "time-penalty" ? "2′" : ""}
      </span>
    );
  }
  if (category === "timeouts") {
    return (
      <span className={`${base} size-full bg-gray-200 text-gray-700 ring-2 ${tone.ring} dark:bg-gray-600 dark:text-gray-100`} title={label}>
        TO
      </span>
    );
  }
  return <span className={`${base} size-3/5 bg-gray-300 ring-2 ${tone.ring} dark:bg-gray-500`} title={label} />;
}

function eventLabel(entry: TickerEntry): string {
  const who = entry.detail ? ` · ${entry.detail}` : "";
  return `${formatGameClock(entry.second)}${who} · ${entry.label} (${entry.scoreHome}:${entry.scoreGuest})`;
}

/** Events as dots on the time axis; overlapping ones stack into lanes. */
function EventStrip({
  entries,
  length,
  width,
  toneOf,
}: {
  entries: TickerEntry[];
  length: number;
  width: number;
  toneOf: (side: TeamSide | null) => Tone;
}) {
  const lanes = assignLanes(
    entries.map((e) => e.second),
    length / width,
    DOT_PX + DOT_GAP_PX,
  );
  const laneCount = lanes.reduce((max, lane) => Math.max(max, lane + 1), 1);
  return (
    <div
      className="relative rounded-xl bg-gray-50 dark:bg-gray-900/40"
      style={{ height: laneCount * (DOT_PX + DOT_GAP_PX) + DOT_GAP_PX }}
    >
      {entries.map((entry, i) => (
        <span
          key={entry.idx}
          className="absolute -translate-x-1/2"
          style={{
            left: `${(entry.second / length) * 100}%`,
            top: DOT_GAP_PX + lanes[i] * (DOT_PX + DOT_GAP_PX),
            width: DOT_PX,
            height: DOT_PX,
          }}
        >
          <EventDot entry={entry} tone={toneOf(entry.side)} label={eventLabel(entry)} />
        </span>
      ))}
    </div>
  );
}

function CategoryChip({
  category,
  count,
  active,
  onToggle,
}: {
  category: EventCategory;
  count: number;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`press inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-sm font-semibold transition-colors ${
        active
          ? "border-gray-300 bg-white text-text dark:border-gray-500 dark:bg-gray-700 dark:text-gray-100"
          : "border-gray-200 text-muted dark:border-gray-700"
      }`}
    >
      <span className={`size-3 rounded-full ${CATEGORY_SWATCH[category]}`} aria-hidden="true" />
      {CATEGORY_LABEL[category]}
      <span className="text-xs tabular-nums text-muted">{count}</span>
    </button>
  );
}

function LayoutToggle({ layout, onChange }: { layout: Layout; onChange: (next: Layout) => void }) {
  const option = (value: Layout, label: string) => (
    <button
      type="button"
      onClick={() => onChange(value)}
      aria-pressed={layout === value}
      className={`min-h-9 rounded-full px-3 text-sm font-semibold transition-colors ${
        layout === value ? "bg-white text-text shadow-sm dark:bg-gray-700 dark:text-gray-100" : "text-muted"
      }`}
    >
      {label}
    </button>
  );
  return (
    <div role="group" aria-label="Ereignisse anordnen" className="inline-flex rounded-full bg-gray-100 p-0.5 dark:bg-gray-900/50">
      {option("together", "Zusammen")}
      {option("split", "Getrennt")}
    </div>
  );
}

/**
 * Score lead over the whole game; from `sm` up the events are added underneath
 * with category filters. Phones get the graph alone.
 */
/** Shown above the plot on phones so the finger does not cover it, below the axis on desktop. */
const HOVER_LABEL_CLASS =
  "pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-gray-900 px-2.5 py-0.5 text-xs font-bold text-white shadow dark:bg-gray-100 dark:text-gray-900";

export default function MatchFlow({ snapshot }: { snapshot: TickerSnapshot }) {
  const { game, entries } = snapshot;
  const [plotEl, setPlotEl] = useState<HTMLDivElement | null>(null);
  const width = useElementWidth(plotEl);
  const [active, setActive] = useState<ReadonlySet<EventCategory>>(new Set(CATEGORY_ORDER));
  const [layout, setLayout] = useState<Layout>("together");
  const [hoverFraction, setHoverFraction] = useState<number | null>(null);
  const uid = useId().replace(/:/g, "");

  const homeIsClub = isClubTeam(game.homeTeam);
  const guestIsClub = isClubTeam(game.awayTeam) && !homeIsClub;
  const homeTone = homeIsClub ? TONES.club : TONES.opponent;
  const guestTone = guestIsClub ? TONES.club : TONES.opponent;
  const toneOf = (side: TeamSide | null): Tone => (side === "guest" ? guestTone : homeTone);

  const length = chartLengthSeconds(game.halftimeMinutes, entries);
  const steps = buildLeadSteps(entries);
  const endSecond = entries.reduce((max, e) => Math.max(max, e.second), 0);
  const peak = steps.reduce((max, s) => Math.max(max, Math.abs(s.lead)), 0);
  const scale = Math.max(MIN_LEAD_SCALE, peak);
  const ticks = axisTicksMinutes(length);
  const halftimeX = ((game.halftimeMinutes * SECONDS_PER_MINUTE) / length) * 100;
  const lead = steps[steps.length - 1].lead;
  const line = leadLine(steps, endSecond, length, scale);
  const revealWidth = (endSecond / length) * VIEW_WIDTH + 5;
  const liveY = ((ZERO_Y - (lead / scale) * ZERO_Y * PEAK_FILL) / VIEW_HEIGHT) * 100;

  const yPercent = (value: number) => ((ZERO_Y - (value / scale) * ZERO_Y * PEAK_FILL) / VIEW_HEIGHT) * 100;
  const axisValues = leadAxisValues(scale);
  const hoverStep =
    hoverFraction !== null && hoverFraction * length <= endSecond ? stepAt(steps, hoverFraction * length) : null;
  const hoverTone = hoverStep && hoverStep.lead < 0 ? guestTone : homeTone;
  const hoverLabel =
    hoverStep && hoverFraction !== null
      ? `${Math.floor((hoverFraction * length) / SECONDS_PER_MINUTE)}′ · ${hoverStep.scoreHome}:${hoverStep.scoreGuest} · ${
          hoverStep.lead > 0 ? `+${hoverStep.lead}` : hoverStep.lead < 0 ? `−${-hoverStep.lead}` : "±0"
        }`
      : null;
  const hoverLabelLeft = `${Math.min(0.9, Math.max(0.1, hoverFraction ?? 0)) * 100}%`;
  const trackPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoverFraction(Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)));
  };

  const oldestFirst = [...entries].reverse().filter((e) => eventCategory(e.kind) !== null);
  const counts = CATEGORY_ORDER.map((c) => oldestFirst.filter((e) => eventCategory(e.kind) === c).length);
  const shown = oldestFirst.filter((e) => active.has(eventCategory(e.kind) as EventCategory));
  const toggle = (category: EventCategory) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (!next.delete(category)) next.add(category);
      return next;
    });

  const summary =
    lead === 0
      ? "Ausgeglichen"
      : `${lead > 0 ? game.homeTeam : game.awayTeam} führt mit ${Math.abs(lead)} ${Math.abs(lead) === 1 ? "Tor" : "Toren"}`;

  return (
    <section
      aria-label="Spielverlauf"
      className="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/0.05)] dark:border-gray-700 dark:bg-gray-800 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h2 className="font-display text-lg font-bold uppercase italic text-text dark:text-gray-100">Spielverlauf</h2>
        <div className="hidden flex-wrap items-center gap-2 sm:flex">
          <div role="group" aria-label="Ereignisse filtern" className="flex flex-wrap gap-2">
            {CATEGORY_ORDER.map((category, i) => (
              <CategoryChip
                key={category}
                category={category}
                count={counts[i]}
                active={active.has(category)}
                onToggle={() => toggle(category)}
              />
            ))}
          </div>
          <LayoutToggle layout={layout} onChange={setLayout} />
        </div>
      </div>

      <div className="mt-10 pl-9 pr-3 sm:mt-4">
        <div ref={setPlotEl}>
          {layout === "split" && (
            <div className="mb-2 hidden sm:block">
              <EventStrip entries={shown.filter((e) => e.side === "home")} length={length} width={width} toneOf={toneOf} />
            </div>
          )}
          <div
            role="img"
            aria-label={`Spielverlauf: ${summary}`}
            className="relative h-28 touch-pan-y sm:h-36"
            onPointerMove={trackPointer}
            onPointerLeave={() => setHoverFraction(null)}
            onPointerCancel={() => setHoverFraction(null)}
          >
            {hoverLabel && (
              <span
                className={`${HOVER_LABEL_CLASS} bottom-full mb-1.5 sm:hidden`}
                style={{ left: hoverLabelLeft }}
                aria-hidden="true"
              >
                {hoverLabel}
              </span>
            )}
            <div className="pointer-events-none absolute inset-y-0 -left-9 w-8 text-[11px] font-semibold tabular-nums text-muted" aria-hidden="true">
              {axisValues.map((value) => (
                <span key={value} className="absolute right-0 -translate-y-1/2" style={{ top: `${yPercent(value)}%` }}>
                  {value > 0 ? `+${value}` : value < 0 ? `−${-value}` : "0"}
                </span>
              ))}
            </div>
            <svg
              viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
              preserveAspectRatio="none"
              className="absolute inset-0 size-full"
              aria-hidden="true"
            >
              <defs>
                <clipPath id={`${uid}-reveal`}>
                  <rect
                    x={-5}
                    y={-5}
                    height={VIEW_HEIGHT + 10}
                    style={{ width: revealWidth }}
                    className="transition-[width] duration-700 ease-out motion-reduce:transition-none"
                  />
                </clipPath>
                <clipPath id={`${uid}-up`}>
                  <rect x={-5} y={-5} width={VIEW_WIDTH + 10} height={ZERO_Y + 5 + ZERO_LINE_BIAS} />
                </clipPath>
                <clipPath id={`${uid}-down`}>
                  <rect x={-5} y={ZERO_Y + ZERO_LINE_BIAS} width={VIEW_WIDTH + 10} height={ZERO_Y + 5} />
                </clipPath>
              </defs>
              {axisValues.map((value) => (
                <line
                  key={`lead-${value}`}
                  x1={0}
                  x2={VIEW_WIDTH}
                  y1={yPercent(value)}
                  y2={yPercent(value)}
                  className="stroke-gray-200/70 dark:stroke-gray-700/70"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {ticks.map((minute) => (
                <line
                  key={minute}
                  x1={(minute * SECONDS_PER_MINUTE * VIEW_WIDTH) / length}
                  x2={(minute * SECONDS_PER_MINUTE * VIEW_WIDTH) / length}
                  y1={0}
                  y2={VIEW_HEIGHT}
                  className="stroke-gray-200/70 dark:stroke-gray-700/70"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              <line
                x1={0}
                x2={VIEW_WIDTH}
                y1={ZERO_Y}
                y2={ZERO_Y}
                className="stroke-gray-300 dark:stroke-gray-600"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <g clipPath={`url(#${uid}-reveal)`}>
                {(
                  [
                    ["up", homeTone],
                    ["down", guestTone],
                  ] as const
                ).map(([half, tone]) => (
                  <g key={half} clipPath={`url(#${uid}-${half})`}>
                    <path d={`${line} V${ZERO_Y} Z`} className={`${tone.fill} opacity-20`} />
                    <path
                      d={line}
                      fill="none"
                      className={tone.stroke}
                      strokeWidth={3}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>
                ))}
              </g>
            </svg>
            <div
              className="pointer-events-none absolute inset-y-0 border-l border-dashed border-gray-400 dark:border-gray-500"
              style={{ left: `${halftimeX}%` }}
              aria-hidden="true"
            />
            {snapshot.status === "running" && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-700 ease-out motion-reduce:transition-none"
                style={{ left: `${(endSecond / length) * 100}%`, top: `${liveY}%` }}
              >
                <span className={`absolute inline-flex size-full animate-ping rounded-full opacity-60 motion-reduce:animate-none ${lead < 0 ? guestTone.bg : homeTone.bg}`} />
                <span className={`relative inline-flex size-full rounded-full ring-2 ring-white dark:ring-gray-800 ${lead < 0 ? guestTone.bg : homeTone.bg}`} />
              </span>
            )}
            {hoverStep && hoverFraction !== null && (
              <>
                <div
                  className="pointer-events-none absolute inset-y-0 border-l border-gray-500 dark:border-gray-300"
                  style={{ left: `${hoverFraction * 100}%` }}
                  aria-hidden="true"
                />
                <span
                  className={`pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white dark:ring-gray-800 ${hoverTone.bg}`}
                  style={{ left: `${hoverFraction * 100}%`, top: `${yPercent(hoverStep.lead)}%` }}
                  aria-hidden="true"
                />
              </>
            )}
            <p className={`pointer-events-none absolute left-1 top-0 max-w-[60%] truncate text-xs font-bold ${homeTone.text}`}>
              {game.homeTeam}
            </p>
            <p className={`pointer-events-none absolute bottom-0 left-1 max-w-[60%] truncate text-xs font-bold ${guestTone.text}`}>
              {game.awayTeam}
            </p>
          </div>

          <div className="relative mt-1 h-5 text-xs font-semibold tabular-nums text-muted" aria-hidden="true">
            {ticks.map((minute) => (
              <span
                key={minute}
                className="absolute -translate-x-1/2"
                style={{ left: `${((minute * SECONDS_PER_MINUTE) / length) * 100}%` }}
              >
                {minute}′
              </span>
            ))}
            {hoverLabel && (
              <span
                className={`${HOVER_LABEL_CLASS} top-0 hidden sm:block`}
                style={{ left: hoverLabelLeft }}
              >
                {hoverLabel}
              </span>
            )}
          </div>

          <div className="mt-2 hidden sm:block">
            <EventStrip
              entries={layout === "together" ? shown : shown.filter((e) => e.side === "guest")}
              length={length}
              width={width}
              toneOf={toneOf}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
