import type { PricingSection as PricingSectionData } from "@/types";

interface Props {
  data: PricingSectionData;
}

function PriceCell({ value }: { value?: string }) {
  if (!value) {
    return <span className="text-muted dark:text-gray-500">–</span>;
  }
  if (value.trim().toLowerCase() === "frei") {
    return <span className="font-bold text-emerald-600 dark:text-emerald-400">frei</span>;
  }
  return <span>{value}</span>;
}

export default function PricingSection({ data }: Props) {
  const { heading = "Eintrittspreise", rows, footnote, infoBox } = data;

  if (!rows || rows.length === 0) return null;

  return (
    <section className="bg-white dark:bg-gray-800 py-14 md:py-20 border-b border-gray-100 dark:border-gray-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="flex items-center gap-4 mb-8">
          <span className="block w-8 h-[3px] bg-primary rounded-full shrink-0" />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted dark:text-gray-400">
            {heading}
          </h2>
        </div>

        {/* Desktop table — hidden on mobile */}
        <div className="hidden sm:block rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-white">
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-[0.2em]">
                  Ticket
                </th>
                <th className="text-right px-5 py-3 text-[11px] font-bold uppercase tracking-[0.2em]">
                  Normal
                </th>
                <th className="text-right px-5 py-3 text-[11px] font-bold uppercase tracking-[0.2em]">
                  Ermäßigt
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row._key}
                  className={`border-t border-gray-100 dark:border-gray-700 ${
                    i % 2 === 0
                      ? "bg-white dark:bg-gray-800"
                      : "bg-gray-50 dark:bg-gray-700"
                  }`}
                >
                  <td className="px-5 py-3.5 font-medium text-text dark:text-gray-100">
                    {row.label}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-text dark:text-gray-100">
                    <PriceCell value={row.normalPrice} />
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-text dark:text-gray-100">
                    <PriceCell value={row.discountedPrice} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards — shown below sm */}
        <div className="sm:hidden space-y-3">
          {rows.map((row) => (
            <div
              key={row._key}
              className="bg-background dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 px-4 py-4"
            >
              <p className="font-bold text-text dark:text-gray-100 text-sm mb-3">
                {row.label}
              </p>
              <div className="flex gap-6">
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted dark:text-gray-500 mb-0.5">
                    Normal
                  </p>
                  <p className="text-sm tabular-nums text-text dark:text-gray-100">
                    <PriceCell value={row.normalPrice} />
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted dark:text-gray-500 mb-0.5">
                    Ermäßigt
                  </p>
                  <p className="text-sm tabular-nums text-text dark:text-gray-100">
                    <PriceCell value={row.discountedPrice} />
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footnote */}
        {footnote && (
          <p className="mt-4 text-xs text-muted dark:text-gray-500 leading-relaxed">
            {footnote}
          </p>
        )}

        {/* InfoBox */}
        {infoBox && (
          <div className="mt-6 border-l-4 border-primary pl-4 py-3 bg-primary/5 dark:bg-primary/10 rounded-r-lg">
            <p className="text-sm text-text dark:text-gray-200 leading-relaxed">
              {infoBox}
            </p>
          </div>
        )}

      </div>
    </section>
  );
}
