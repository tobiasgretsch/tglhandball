"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type WidgetType = "tabelle" | "spielplan";

export interface HandballWidgetProps {
  teamId: string;
  type: WidgetType;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HB_SCRIPT_URL = "https://www.handball.net/widgets/embed/v1.js";

// ─── Skeleton ────────────────────────────────────────────────────────────────

function WidgetSkeleton({ type }: { type: WidgetType }) {
  const rows = type === "tabelle" ? 10 : 6;
  return (
    <div className="animate-pulse space-y-2" aria-hidden="true">
      <div className="h-9 bg-gray-200 rounded w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-2">
          <div className="h-7 bg-gray-100 rounded flex-1" />
          <div className="h-7 bg-gray-100 rounded w-16" />
          <div className="h-7 bg-gray-100 rounded w-16" />
        </div>
      ))}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function HandballWidget({ teamId, type }: HandballWidgetProps) {
  const containerId = `handball-${type}-widget`;
  // Sanitise teamId so it is safe to use as a script id attribute
  const scriptWidgetId = `hb-widget-${type}-${teamId.replace(/[^a-z0-9]/gi, "-")}`;

  const [loaded, setLoaded] = useState(false);

  // Watch for the widget injecting DOM nodes — swap skeleton for real content
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const observer = new MutationObserver(() => {
      if (container.children.length > 0) {
        setLoaded(true);
        observer.disconnect();
      }
    });
    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [containerId]);

  return (
    <>
      {/* Preconnect — React 19 hoists <link> to <head> automatically */}
      <link rel="preconnect" href="https://www.handball.net" />
      <link rel="dns-prefetch" href="https://www.handball.net" />

      {/*
       * Step 1 — Run the exact original loader IIFE once per page.
       * Next.js deduplicates Script components by `id`, so even though two
       * HandballWidget instances render this, the IIFE only executes once.
       * The IIFE sets up window._hb as a call queue and loads the external script.
       */}
      <Script id="hb-loader" strategy="afterInteractive">{`
        (function(e,t,n,r,i,s,o){e[i]=e[i]||function(){(e[i].q=e[i].q||[]).push(arguments)},
        e[i].l=1*new Date;s=t.createElement(n),o=t.getElementsByTagName(n)[0];s.async=1;
        s.src=r;o.parentNode.insertBefore(s,o)})(window,document,"script",'${HB_SCRIPT_URL}',"_hb");
      `}</Script>

      {/*
       * Step 2 — Queue this specific widget.
       * Unique id per type+teamId so client-side navigation to a different
       * team page re-executes the init for that team's id.
       */}
      <Script id={scriptWidgetId} strategy="afterInteractive">{`
        _hb({widget:'${type}',teamId:'${teamId}',container:'${containerId}'});
      `}</Script>

      <div className="relative">
        {!loaded && <WidgetSkeleton type={type} />}
        <div id={containerId} />
      </div>
    </>
  );
}
