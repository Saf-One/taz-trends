import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { BrandLogo } from "@/components/layout/BrandLogo";

export const metadata = { title: "Sign in" };

export default function SignInPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const next = searchParams.next ?? "/";

  return (
    <main className="container-page flex min-h-screen flex-col items-center justify-center">
      <div className="card w-full max-w-sm p-8">
        <div className="mb-4 w-40">
          <BrandLogo />
        </div>
        <p className="mb-6 text-sm text-ink/70">
          Sign in to place orders and track them. Google only.
        </p>

        {searchParams.error && (
          <p className="mb-4 rounded-md bg-red-50 p-2 text-sm text-red-700">
            Sign-in failed. Please try again.
          </p>
        )}

        <GoogleSignInButton next={next} />

        <p className="mt-6 text-center text-xs text-ink/50">
          <Link href="/" className="underline">
            Back to store
          </Link>
        </p>
      </div>
    </main>
  );
}
