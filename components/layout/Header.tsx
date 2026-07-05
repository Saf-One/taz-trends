"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/CartProvider";
import { SignOutButton } from "@/components/auth/SignOutButton";

export function Header({
  userEmail,
  isAdmin,
}: {
  userEmail: string | null;
  isAdmin: boolean;
}) {
  const { count } = useCart();

  return (
    <header className="border-b border-ink/10">
      <div className="container-page flex h-20 items-center justify-between">
        <Link href="/" className="block h-full w-32 sm:w-40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/navbar/logo_navbar.png"
            alt="Taz Trends"
            className="h-full w-full object-contain"
          />
        </Link>

        <nav className="flex items-center gap-2 text-xs sm:gap-4 sm:text-sm">
          <Link href="/quote" className="hover:text-wine">
            Request a quote
          </Link>
          {isAdmin && (
            <Link href="/admin" className="hover:text-wine">
              Admin
            </Link>
          )}
          <Link href="/cart" className="relative hover:text-wine">
            Cart
            {count > 0 && (
              <span className="ml-1 rounded-full bg-wine px-1.5 py-0.5 text-xs text-white">
                {count}
              </span>
            )}
          </Link>
          {userEmail ? (
            <SignOutButton />
          ) : (
            <Link href="/sign-in" className="btn-outline">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
