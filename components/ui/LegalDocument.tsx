import { Fragment } from "react";
import { useTranslations } from "next-intl";

export type LegalBlock =
  | { type: "h2" | "h3" | "h4" | "p" | "strong" | "address"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; rows: [string, string][] };

const URL_PATTERN = /(https?:\/\/\S+?)(?=[.,;:]?(?:\s|$))/g;
const H2_CLASS =
  "font-display font-bold italic uppercase text-2xl tracking-[-0.02em] text-text dark:text-white mt-12 mb-4";
const H3_CLASS = "text-lg font-bold text-text dark:text-white mt-8 mb-2";
const H4_CLASS = "text-base font-semibold text-text dark:text-white mt-5 mb-1";
const BODY_CLASS = "max-w-[65ch] leading-[1.7] text-text dark:text-gray-300 mb-4";

/** Renders plain text, turning bare URLs into external links. */
function Linkified({ text }: { text: string }) {
  const parts = text.split(URL_PATTERN);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link underline underline-offset-2 break-all"
          >
            {part}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

function Block({ block }: { block: LegalBlock }) {
  const t = useTranslations("legalDocument");
  switch (block.type) {
    case "h2":
      return <h2 className={H2_CLASS}>{block.text}</h2>;
    case "h3":
      return <h3 className={H3_CLASS}>{block.text}</h3>;
    case "h4":
      return <h4 className={H4_CLASS}>{block.text}</h4>;
    case "strong":
      return <p className={`${BODY_CLASS} font-semibold`}>{block.text}</p>;
    case "address":
      return <p className={`${BODY_CLASS} whitespace-pre-line`}>{block.text}</p>;
    case "p":
      return (
        <p className={BODY_CLASS}>
          <Linkified text={block.text} />
        </p>
      );
    case "ul":
      return (
        <ul className={`${BODY_CLASS} list-disc pl-6`}>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "table":
      return (
        <table className="mb-4 w-full max-w-[65ch] text-left text-sm text-text dark:text-gray-300">
          <thead>
            <tr className="border-b border-gray-300 dark:border-gray-700">
              <th scope="col" className="py-2 pr-4 font-semibold">{t("cookieName")}</th>
              <th scope="col" className="py-2 font-semibold">{t("duration")}</th>
            </tr>
          </thead>
          <tbody>
            {block.rows.map(([name, duration]) => (
              <tr key={name} className="border-b border-gray-200 dark:border-gray-800">
                <td className="py-2 pr-4 font-mono break-all">{name}</td>
                <td className="py-2">{duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
  }
}

export default function LegalDocument({ blocks }: { blocks: LegalBlock[] }) {
  return (
    <div className="bg-background dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-4">
        {blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </div>
    </div>
  );
}
