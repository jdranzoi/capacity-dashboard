"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useTeamsRoutePending } from "@/components/teams/_shared/teams-route-pending-shell";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { CompositionView } from "@/lib/teams/composition/teams-composition-utils";

const VIEW_OPTIONS = [
  { value: "type", label: "by Project Type" },
  { value: "pm", label: "by Project Manager" },
] as const;

export function TeamsCompositionViewToggle({
  view,
  compact = false,
}: {
  view: CompositionView;
  compact?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const teamsPending = useTeamsRoutePending();

  const onChange = useCallback(
    (nextView: CompositionView) => {
      if (nextView === view) return;

      const params = new URLSearchParams(searchParams.toString());
      if (nextView === "pm") {
        params.set("view", "pm");
      } else {
        params.delete("view");
      }

      const query = params.toString();
      const href = query ? `${pathname}?${query}` : pathname;

      if (teamsPending) {
        teamsPending.navigateWithTransition(href);
      } else {
        router.push(href, { scroll: false });
      }
    },
    [pathname, router, searchParams, teamsPending, view],
  );

  return (
    <SegmentedControl
      label="View"
      value={view}
      onChange={onChange}
      options={VIEW_OPTIONS}
      hideLabel={compact}
    />
  );
}
