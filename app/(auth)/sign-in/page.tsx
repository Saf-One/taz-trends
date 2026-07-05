import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { BrandLogo } from "@/components/layout/BrandLogo";

export const metadata = { title: "Sign in" };

// Saree-border scallop: a row of gold semicircles hanging from the edge -
// the "jhalar" trim seen on ethnic-wear borders. This is the page signature.
const sareeBorder: React.CSSProperties = {
  height: "16px",
  backgroundImage:
    "radial-gradient(circle at 8px 0, #b08d57 6px, transparent 7px)",
  backgroundSize: "16px 16px",
  backgroundRepeat: "repeat-x",
};

export default function SignInPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const next = searchParams.next ?? "/";

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Editorial panel - the atelier side */}
      <aside className="relative hidden overflow-hidden bg-wine text-logo-bg lg:flex lg:flex-col lg:justify-between lg:p-14">
        {/* Mehrab arch - the niche silhouette of a boutique doorway */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-1/2 -translate-y-1/2"
          style={{
            width: "460px",
            height: "620px",
            border: "1px solid rgba(176,141,87,0.4)",
            borderTopLeftRadius: "230px",
            borderTopRightRadius: "230px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-14 top-1/2 -translate-y-1/2"
          style={{
            width: "460px",
            height: "620px",
            border: "1px solid rgba(176,141,87,0.2)",
            borderTopLeftRadius: "230px",
            borderTopRightRadius: "230px",
          }}
        />

        <p className="relative text-xs uppercase tracking-[0.3em] text-gold">
          Handloom · Handpicked
        </p>

        <div className="relative max-w-md">
          <h2 className="font-serif text-5xl leading-[1.1]">
            Every drape
            <br />
            tells a story.
          </h2>
          <p className="mt-6 text-sm leading-relaxed text-logo-bg/70">
            Sign in to save the pieces you love, place your orders, and follow
            each one all the way to your door.
          </p>
        </div>

        {/* Saree border along the panel foot */}
        <div className="relative" style={sareeBorder} aria-hidden />
      </aside>

      {/* Sign-in panel */}
      <section className="flex flex-col items-center justify-center bg-logo-bg px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <div className="w-56">
              <BrandLogo />
            </div>
          </div>

          <p className="text-xs uppercase tracking-[0.25em] text-gold">
            Welcome
          </p>
          <h1 className="mt-2 font-serif text-3xl text-ink">
            Step into the atelier
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink/60">
            Sign in with Google to place orders and track them - no passwords to
            remember.
          </p>

          {searchParams.error && (
            <p className="mt-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Sign-in didn&apos;t go through. Give it another try.
            </p>
          )}

          <div className="mt-8">
            <GoogleSignInButton next={next} />
          </div>

          <div className="mt-6 flex items-center gap-3 text-[11px] uppercase tracking-wider text-ink/40">
            <span className="h-px flex-1 bg-ink/10" />
            Secure sign-in by Google
            <span className="h-px flex-1 bg-ink/10" />
          </div>

          <p className="mt-8 text-sm text-ink/50">
            <Link href="/" className="text-wine underline underline-offset-4 hover:text-wine/80">
              Back to store
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
