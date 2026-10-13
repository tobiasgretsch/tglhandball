import { PortableText as SanityPortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@/types";

const components = {
  block: {
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1 className="font-display font-bold italic uppercase text-4xl tracking-[-0.02em] leading-[1.05] text-text dark:text-gray-100 mb-4 mt-10 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="font-display font-bold italic uppercase text-3xl tracking-[-0.02em] leading-[1.1] text-text dark:text-gray-100 mb-3 mt-9 first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="text-xl font-semibold tracking-[-0.01em] leading-snug text-text dark:text-gray-100 mb-2 mt-7 first:mt-0">
        {children}
      </h3>
    ),
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="mb-5 text-text/80 dark:text-gray-300 leading-[1.7] max-w-[65ch] last:mb-0">{children}</p>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="border-l-4 border-primary pl-5 italic my-6 text-lg leading-[1.6] text-muted dark:text-gray-400 max-w-[65ch]">
        {children}
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-bold text-text dark:text-gray-100">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="italic">{children}</em>
    ),
    link: ({
      value,
      children,
    }: {
      value?: { href?: string };
      children?: React.ReactNode;
    }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary dark:text-primary-glow hover:text-primary-light transition-colors"
      >
        {children}
      </a>
    ),
  },
  list: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <ul className="list-disc list-outside pl-5 mb-5 space-y-2 max-w-[65ch] text-text/80 dark:text-gray-300">
        {children}
      </ul>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <ol className="list-decimal list-outside pl-5 mb-5 space-y-2 max-w-[65ch] text-text/80 dark:text-gray-300">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <li className="leading-[1.7]">{children}</li>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <li className="leading-[1.7]">{children}</li>
    ),
  },
};

interface PortableTextProps {
  value: PortableTextBlock[];
  className?: string;
}

export default function PortableText({ value, className }: PortableTextProps) {
  return (
    <div className={className}>
      <SanityPortableText value={value} components={components as Parameters<typeof SanityPortableText>[0]["components"]} />
    </div>
  );
}
