import { createFileRoute } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Console, type AppTab } from "@/components/skyhook/console";

const TABS = new Set<AppTab>(["overview", "files", "mcp", "bucket"]);

export const Route = createFileRoute("/app")({
  validateSearch: (search: Record<string, unknown>): { tab: AppTab } => {
    const tab = typeof search.tab === "string" && TABS.has(search.tab as AppTab)
      ? (search.tab as AppTab)
      : "overview";
    return { tab };
  },
  component: AppPage,
});

function AppPage() {
  const { tab } = Route.useSearch();
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="min-h-dvh bg-bg" />;
  }
  if (!user) return <RedirectToSignIn />;
  return <Console tab={tab} />;
}
