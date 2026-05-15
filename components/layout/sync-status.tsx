import { createServiceClientCached } from "@/lib/supabase/server";
import { SyncSnapshotIdCopy } from "@/components/layout/sync-snapshot-id-copy";
import { formatDistanceToNow } from "date-fns";
import { cacheLife } from "next/cache";

type StatusTier = "fresh" | "stale" | "old" | "error";

function getStatusTier(
  completedAt: string | null,
  status: string | null,
): StatusTier {
  if (!completedAt || status === "failed") return "error";
  const ageMs = Date.now() - new Date(completedAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  if (ageHours < 4) return "fresh";
  if (ageHours < 24) return "stale";
  return "old";
}

const tierStyles: Record<StatusTier, string> = {
  fresh: "bg-green-500/10 text-green-700 dark:text-green-400",
  stale: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  old: "bg-red-500/10 text-red-700 dark:text-red-400",
  error: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const tierDot: Record<StatusTier, string> = {
  fresh: "bg-green-500",
  stale: "bg-yellow-500",
  old: "bg-red-500",
  error: "bg-red-500",
};

export async function SyncStatus() {
  'use cache'
  cacheLife('minutes')

  let completedAt: string | null = null;
  let snapshotId: string | null = null;
  let status: string | null = null;

  try {
    const supabase = createServiceClientCached();
    const { data, error } = await supabase
      .from("sync_snapshot")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    completedAt = data?.created_at ?? null;
    snapshotId = data?.id ?? null;
    status = null;
  } catch {
    // Supabase not yet configured — show no-data state
  }

  const tier = getStatusTier(completedAt, status);
  const label =
    completedAt && status !== "failed"
      ? `Synced ${formatDistanceToNow(new Date(completedAt), { addSuffix: true })}`
      : "Sync unavailable";

  return (
    <span
      className={`inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-full px-2.5 py-1 text-xs font-medium ${tierStyles[tier]}`}
      title={snapshotId ?? undefined}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tierDot[tier]}`} />
      <span className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5">
        <span className="shrink-0">{label}</span>
        {snapshotId && completedAt && status !== "failed" ? (
          <>
            <span className="mx-0.5 shrink-0 opacity-50" aria-hidden>
              ·
            </span>
            <span className="min-w-0 break-all font-mono text-[10px] font-normal tracking-tight">
              {snapshotId}
            </span>
            <SyncSnapshotIdCopy snapshotId={snapshotId} />
          </>
        ) : null}
      </span>
    </span>
  );
}
