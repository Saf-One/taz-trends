import Link from "next/link";

export function BrandLogo({ href = "/" }: { href?: string }) {
  const logo = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/navbar/logo_navbar.png"
      alt="Taz Trends"
      className="h-12 w-auto object-contain"
    />
  );

  return href ? (
    <Link href={href} className="block">
      {logo}
    </Link>
  ) : (
    logo
  );
}
