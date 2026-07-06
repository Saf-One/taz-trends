"use client";

import ReactMarkdown from "react-markdown";

/**
 * Client-component wrapper around react-markdown so it works inside
 * Next.js Server Components (react-markdown is ESM-only + uses hooks
 * internally without a "use client" directive).
 */
export function Markdown({ children }: { children: string }) {
  return <ReactMarkdown>{children}</ReactMarkdown>;
}
