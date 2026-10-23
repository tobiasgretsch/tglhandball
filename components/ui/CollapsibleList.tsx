"use client";

import { useState, type ReactNode } from "react";

interface CollapsibleListProps {
  /** Pre-rendered rows; server-rendered elements are fine. */
  items: ReactNode[];
  /** Rows shown before "Alle anzeigen". */
  initialCount: number;
  className?: string;
}

export default function CollapsibleList({ items, initialCount, className }: CollapsibleListProps) {
  const [expanded, setExpanded] = useState(false);
  const collapsible = items.length > initialCount;
  const visible = expanded ? items : items.slice(0, initialCount);

  return (
    <>
      <ul className={className}>{visible}</ul>
      {collapsible && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="press mt-4 inline-flex min-h-11 items-center rounded-full border border-gray-200 bg-white px-5 text-sm font-bold text-text transition-colors hover:border-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          Alle {items.length} anzeigen
        </button>
      )}
    </>
  );
}
