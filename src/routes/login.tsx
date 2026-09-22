import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { GoogleButton, XButton } from "@/components/skyhook/google-button";
import { SkyhookWordmark } from "@/components/skyhook/logo";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="min-h-dvh bg-bg" />;
  }
  if (user) {
    return <Navigate to="/app" search={{ tab: "overview" }} />;
  }
  return (
    <main className="grid min-h-dvh bg-bg text-fg md:grid-cols-2">
      <section className="flex flex-col justify-between px-6 py-8 sm:px-12">
        <Link to="/">
          <SkyhookWordmark />
        </Link>
        <div className="mx-auto w-full max-w-sm py-16">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">
            Sign in
          </p>
          <h1 className="mt-4 font-display text-4xl tracking-tight">
            Continue with Google
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Skyhook uses your Google account to scope buckets, tokens, and
            uploads to you.
          </p>
          {authEnabled ? (
            <div className="mt-8 flex flex-col items-stretch gap-3">
              <GoogleButton callbackURL="/app" />
              <XButton callbackURL="/app" className="self-center" />
            </div>
          ) : (
            <p className="mt-8 text-sm text-muted">Sign-in is disabled.</p>
          )}
        </div>
        <p className="text-xs text-subtle">Private objects. Encrypted credentials.</p>
      </section>
      <section className="hidden border-l border-line bg-surface md:flex md:flex-col md:justify-end md:p-12">
        <p className="font-display text-4xl leading-tight tracking-tight">
          An MCP server that uploads to S3.
        </p>
        <p className="mt-4 max-w-sm text-sm text-muted">
          After Google sign-in, generate a bearer token and point any MCP client
          at your Skyhook endpoint.
        </p>
      </section>
    </main>
  );
}
