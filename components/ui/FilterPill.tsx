interface FilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

/** Rounded toggle used in the sticky filter bars (news, fixtures, gallery). */
export default function FilterPill({ label, active, onClick }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`press shrink-0 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors border ${
        active
          ? "bg-primary border-primary text-white shadow-[0_8px_24px_-8px_rgb(218_37_28/0.55)]"
          : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-muted dark:text-gray-300 hover:border-primary hover:text-primary dark:hover:text-primary-glow"
      }`}
    >
      {label}
    </button>
  );
}
