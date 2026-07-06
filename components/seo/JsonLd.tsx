/**
 * JSON-LD structured data component.
 * Renders schema.org markup inline for search engines and AI crawlers.
 * Safe: accepts pre-built schema objects, no user input in dangerous positions.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
