"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/offers", label: "Offers" },
  { href: "/admin/quotes", label: "Quotes" },
];

export function AdminNav({ layout }: { layout: "sidebar" | "topbar" }) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  if (layout === "topbar") {
    return (
      <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 text-sm">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`shrink-0 rounded-full px-3 py-1.5 transition-colors ${
              isActive(n.href)
                ? "bg-wine text-white"
                : "text-ink/70 hover:bg-blush"
            }`}
          >
            {n.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-1 text-sm">
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          className={`rounded px-2 py-1.5 transition-colors ${
            isActive(n.href)
              ? "bg-wine text-white"
              : "hover:bg-blush"
          }`}
        >
          {n.label}
        </Link>
      ))}
    </nav>
  );
}
