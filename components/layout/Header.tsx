"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart/CartProvider";
import { useCartProducts } from "@/lib/cart/useCartProducts";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { formatPaise } from "@/lib/config";

const CATEGORIES = ["Sarees", "Suits", "Lehengas", "Kurtis", "Accessories"];

export function Header({
  userEmail,
  isAdmin,
}: {
  userEmail: string | null;
  isAdmin: boolean;
}) {
  const { count, lines } = useCart();
  const { products, unitPaise } = useCartProducts(lines);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartPreview, setCartPreview] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const cartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const subtotal = lines.reduce((s, l) => s + unitPaise(l) * l.quantity, 0);

  // Track scroll for sticky shadow transition
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchOpen]);

  // Close mobile drawer / cart preview on escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setCartPreview(false);
        setSearchOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const showCartPreview = useCallback(() => {
    if (cartTimeoutRef.current) clearTimeout(cartTimeoutRef.current);
    setCartPreview(true);
  }, []);

  const hideCartPreview = useCallback(() => {
    cartTimeoutRef.current = setTimeout(() => setCartPreview(false), 300);
  }, []);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  }

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-shadow duration-200 ${
          scrolled
            ? "bg-white/95 shadow-sm"
            : "bg-white/95"
        }`}
      >
        {/* Top row: logo + nav links */}
        <div className="container-page flex h-16 items-center justify-between md:h-20">
          {/* Mobile hamburger */}
          <button
            className="flex items-center justify-center p-1 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 text-ink"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Logo */}
          <Link href="/" className="block h-10 w-28 shrink-0 sm:h-12 sm:w-32">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/navbar/logo_navbar.png"
              alt="Taz Trends"
              className="h-full w-full object-contain"
            />
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden items-center gap-4 md:flex">
            <Link href="/quote" className="text-sm text-ink/70 hover:text-wine">
              Request a quote
            </Link>
            {isAdmin && (
              <Link href="/admin" className="text-sm text-ink/70 hover:text-wine">
                Admin
              </Link>
            )}
            {/* Search icon / input */}
            <div className="relative flex items-center">
              {searchOpen ? (
                <form onSubmit={handleSearchSubmit} className="flex items-center">
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products…"
                    className="w-48 rounded-md border border-wine/30 bg-blush/50 px-3 py-1.5 text-sm text-ink outline-none transition-all duration-200 focus:w-64 focus:border-wine lg:w-56"
                    onBlur={() => {
                      if (!searchQuery) setSearchOpen(false);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="-ml-8 mr-2 text-ink/40 hover:text-ink"
                    aria-label="Close search"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="rounded-full p-2 text-ink/60 hover:bg-blush hover:text-wine"
                  aria-label="Search"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
              )}
            </div>

            {/* Cart with preview */}
            <div
              className="relative"
              onMouseEnter={showCartPreview}
              onMouseLeave={hideCartPreview}
            >
              <Link
                href="/cart"
                className="relative flex items-center gap-1 rounded-full px-2 py-1.5 text-ink/70 hover:bg-blush hover:text-wine"
                aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                {count > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-wine text-[10px] font-bold text-white">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </Link>
              {/* Mini cart dropdown */}
              {cartPreview && count > 0 && (
                <div
                  className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-ink/10 bg-white shadow-lg"
                  onMouseEnter={showCartPreview}
                  onMouseLeave={hideCartPreview}
                >
                  <div className="p-3">
                    <p className="mb-2 text-xs font-medium text-ink/50 uppercase tracking-wider">
                      Cart ({count} item{count === 1 ? "" : "s"})
                    </p>
                    <ul className="max-h-48 space-y-2 overflow-y-auto">
                      {lines.slice(0, 5).map((line) => {
                        const p = products[line.product_id];
                        const key = `${line.product_id}:${line.variant_id ?? "null"}`;
                        return (
                          <li key={key} className="flex items-center gap-2 text-sm">
                            <span className="w-5 shrink-0 text-center text-xs text-ink/40">
                              {line.quantity}×
                            </span>
                            <span className="truncate text-ink">{p?.title ?? "…"}</span>
                            <span className="ml-auto shrink-0 text-wine">
                              {formatPaise(unitPaise(line) * line.quantity)}
                            </span>
                          </li>
                        );
                      })}
                      {lines.length > 5 && (
                        <li className="text-center text-xs text-ink/40">
                          +{lines.length - 5} more item{lines.length - 5 === 1 ? "" : "s"}
                        </li>
                      )}
                    </ul>
                    <div className="mt-2 flex items-center justify-between border-t border-ink/10 pt-2 text-sm font-medium">
                      <span>Subtotal</span>
                      <span className="text-wine">{formatPaise(subtotal)}</span>
                    </div>
                    <Link
                      href="/cart"
                      className="btn-primary mt-2 flex w-full items-center justify-center text-sm"
                    >
                      View cart
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {userEmail ? (
              <SignOutButton />
            ) : (
              <Link href="/sign-in" className="btn-outline text-sm">
                Sign in
              </Link>
            )}
          </nav>

          {/* Mobile right side icons */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="rounded-full p-2 text-ink/60 hover:bg-blush"
              aria-label="Search"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
            <Link
              href="/cart"
              className="relative rounded-full p-2 text-ink/60 hover:bg-blush"
              aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-wine text-[9px] font-bold text-white">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile search bar (expanded below logo row) */}
        {searchOpen && (
          <div className="border-t border-ink/5 px-4 pb-3 pt-2 md:hidden">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products…"
                className="input flex-1 text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="text-xs text-ink/50 hover:text-ink"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* Category nav bar */}
        <div className="hidden border-t border-ink/5 md:block">
          <div className="container-page flex items-center justify-center gap-1 py-2">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/products?category=${cat.toLowerCase()}`}
                className="rounded-full px-3 py-1 text-xs font-medium text-ink/60 transition-colors hover:bg-blush hover:text-wine"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-ink/10 px-4 py-4">
              <Link href="/" className="block h-8 w-24" onClick={() => setMobileOpen(false)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/navbar/logo_navbar.png"
                  alt="Taz Trends"
                  className="h-full w-full object-contain"
                />
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-full p-1 text-ink/40 hover:text-ink"
                aria-label="Close menu"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Drawer nav links */}
            <nav className="flex-1 overflow-y-auto px-4 py-4">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-ink/40">
                Categories
              </p>
              <ul className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <li key={cat}>
                    <Link
                      href={`/products?category=${cat.toLowerCase()}`}
                      className="block rounded-md px-3 py-2 text-sm text-ink/80 hover:bg-blush hover:text-wine"
                      onClick={() => setMobileOpen(false)}
                    >
                      {cat}
                    </Link>
                  </li>
                ))}
              </ul>

              <hr className="my-4 border-ink/10" />

              <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-ink/40">
                Account
              </p>
              <ul className="space-y-1">
                {userEmail ? (
                  <>
                    <li className="px-3 py-1.5 text-xs text-ink/50">{userEmail}</li>
                    <li>
                      <Link
                        href="/orders"
                        className="block rounded-md px-3 py-2 text-sm text-ink/80 hover:bg-blush hover:text-wine"
                        onClick={() => setMobileOpen(false)}
                      >
                        My Orders
                      </Link>
                    </li>
                    <li>
                      <SignOutButton />
                    </li>
                  </>
                ) : (
                  <li>
                    <Link
                      href="/sign-in"
                      className="btn-outline block rounded-md px-3 py-2 text-center text-sm"
                      onClick={() => setMobileOpen(false)}
                    >
                      Sign in
                    </Link>
                  </li>
                )}
              </ul>

              <hr className="my-4 border-ink/10" />

              <ul className="space-y-1">
                <li>
                  <Link
                    href="/cart"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink/80 hover:bg-blush hover:text-wine"
                    onClick={() => setMobileOpen(false)}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 01-8 0" />
                    </svg>
                    Cart
                    {count > 0 && (
                      <span className="ml-auto rounded-full bg-wine px-1.5 py-0.5 text-xs text-white">
                        {count}
                      </span>
                    )}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/quote"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink/80 hover:bg-blush hover:text-wine"
                    onClick={() => setMobileOpen(false)}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    Request a quote
                  </Link>
                </li>
                {isAdmin && (
                  <li>
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink/80 hover:bg-blush hover:text-wine"
                      onClick={() => setMobileOpen(false)}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                      </svg>
                      Admin
                    </Link>
                  </li>
                )}
              </ul>
            </nav>

            {/* Drawer footer */}
            <div className="border-t border-ink/10 px-4 py-3">
              <p className="text-[10px] text-ink/40">&copy; 2024 Taz Trends</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
