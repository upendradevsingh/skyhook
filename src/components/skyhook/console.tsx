import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Box,
  Check,
  Copy,
  FileUp,
  History,
  KeyRound,
  LoaderCircle,
  Radio,
  Trash2,
  Unplug,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  clearConnectionFn,
  createTokenFn,
  deleteObjectFn,
  downloadObjectFn,
  getOverviewFn,
  listObjectsFn,
  listTokensFn,
  listVersionsFn,
  playgroundToolFn,
  revokeTokenFn,
  saveConnectionFn,
  testConnectionFn,
  uploadObjectFn,
} from "@/lib/skyhook/functions";
import { MCP_TOOLS, type ConnectionPublic, type ObjectRecord } from "@/lib/skyhook/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  copyText,
  downloadBase64,
  fileToBase64,
  formatBytes,
  formatRelative,
  normalizeObjectKey,
} from "@/lib/utils";
import { SkyhookWordmark } from "./logo";

export type AppTab = "overview" | "files" | "mcp" | "bucket";

const TABS: { id: AppTab; label: string; icon: typeof Box }[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "files", label: "Files", icon: Box },
  { id: "mcp", label: "MCP", icon: Radio },
  { id: "bucket", label: "Bucket", icon: KeyRound },
];

export function Console({ tab }: { tab: AppTab }) {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const overview = useQuery({
    queryKey: ["skyhook", "overview"],
    queryFn: () => getOverviewFn(),
    enabled: Boolean(user),
  });

  if (isPending) {
    return (
      <div className="min-h-dvh bg-bg p-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="mt-8 h-64 w-full" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-5">
          <Link to="/" className="shrink-0">
            <SkyhookWordmark />
          </Link>
          <UserButton />
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-5 lg:flex-row lg:gap-10">
        <nav className="flex gap-1 overflow-x-auto lg:w-48 lg:flex-col lg:overflow-visible">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  void navigate({ to: "/app", search: { tab: item.id } })
                }
                className={`inline-flex h-11 min-w-28 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-raised text-fg"
                    : "text-muted hover:bg-raised/60 hover:text-fg"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 flex-1 pb-16">
          {tab === "overview" && (
            <OverviewPanel loading={overview.isLoading} data={overview.data} />
          )}
          {tab === "files" && <FilesPanel />}
          {tab === "mcp" && <McpPanel />}
          {tab === "bucket" && (
            <BucketPanel
              connection={overview.data?.connection}
              onChanged={() => void overview.refetch()}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewPanel({
  loading,
  data,
}: {
  loading: boolean;
  data: Awaited<ReturnType<typeof getOverviewFn>> | undefined;
}) {
  if (loading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }
  const mode = data.connection.mode;
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
          Console
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Overview</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Storage" value={mode === "s3" ? data.connection.bucket : "Sandbox"}>
          <Badge tone={mode === "s3" ? "ok" : "neutral"}>
            {mode === "s3" ? "S3" : "Sandbox"}
          </Badge>
        </Stat>
        <Stat label="Objects" value={String(data.objectCount)}>
          <span className="text-sm text-muted tabular-nums">
            {formatBytes(data.totalBytes)}
          </span>
        </Stat>
        <Stat label="MCP tokens" value={String(data.tokens.length)}>
          <span className="text-sm text-muted">
            Last upload {formatRelative(data.lastUploadAt)}
          </span>
        </Stat>
      </div>
      <Card className="p-5">
        <h2 className="text-sm font-medium">Activity</h2>
        {data.recent.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            No events yet. Upload a file or run a tool from the MCP playground.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {data.recent.map((row) => (
              <li
                key={row.id}
                className="flex items-start justify-between gap-3 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className={row.ok ? "text-fg" : "text-danger"}>
                    <span className="font-mono text-[12px]">{row.action}</span>
                    {row.key ? (
                      <span className="ml-2 text-muted">{row.key}</span>
                    ) : null}
                  </p>
                  {row.detail ? (
                    <p className="truncate text-xs text-subtle">{row.detail}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-xs text-subtle tabular-nums">
                  {formatRelative(row.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: ReactNode;
}) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-wider text-subtle">{label}</p>
      <p className="mt-2 truncate font-display text-3xl tracking-tight">{value}</p>
      <div className="mt-3">{children}</div>
    </Card>
  );
}
