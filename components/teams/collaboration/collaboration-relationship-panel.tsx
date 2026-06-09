"use client";

import { useMemo } from "react";
import { X } from "lucide-react";

import { RoleBadge } from "@/components/ui/role-badge";
import { isPmRoleKey, isTlRoleKey } from '@/lib/domain/role-keys'
import { cn } from "@/lib/utils";
import type {
  CollaborationEdge,
  CollaborationNode,
  CollaborationProjectRef,
} from "@/lib/teams/collaboration/collaboration-types";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en", { month: "short", year: "numeric" });
}

function PersonHeading({
  node,
  onSelectNode,
}: {
  node: CollaborationNode
  onSelectNode: (id: string) => void
}) {
  const projectLabel = node.totalProjects === 1 ? "project" : "projects";
  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={() => onSelectNode(node.id)}
        className="max-w-full hover:opacity-80"
        aria-label={`View ${node.name} details`}
      >
        <RoleBadge roleKey={node.roleKey} className="text-sm">
          {node.name}
        </RoleBadge>
      </button>
      <p className="text-[0.7rem] text-muted-foreground">{node.roleLabel}</p>
      <p className="text-[0.7rem] tabular-nums text-muted-foreground">
        {node.totalProjects} {projectLabel}
      </p>
    </div>
  );
}

function orderPmLeftTlRight(
  personA: CollaborationNode,
  personB: CollaborationNode,
): { pm: CollaborationNode; tl: CollaborationNode } {
  if (isPmRoleKey(personA.roleKey) && isTlRoleKey(personB.roleKey)) {
    return { pm: personA, tl: personB };
  }
  if (isTlRoleKey(personA.roleKey) && isPmRoleKey(personB.roleKey)) {
    return { pm: personB, tl: personA };
  }
  if (isPmRoleKey(personB.roleKey)) return { pm: personB, tl: personA };
  if (isPmRoleKey(personA.roleKey)) return { pm: personA, tl: personB };
  if (isTlRoleKey(personA.roleKey)) return { pm: personB, tl: personA };
  if (isTlRoleKey(personB.roleKey)) return { pm: personA, tl: personB };
  return { pm: personA, tl: personB };
}

function MetricCell({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg bg-muted/30 px-3 py-2">
      <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-base font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function CollaborationRelationshipPanel({
  edge,
  personA,
  personB,
  sharedProjects,
  sharedTeamMembers,
  onClose,
  onSelectNode,
  className,
}: {
  edge: CollaborationEdge;
  personA: CollaborationNode;
  personB: CollaborationNode;
  sharedProjects: CollaborationProjectRef[];
  sharedTeamMembers: CollaborationNode[];
  onClose: () => void;
  onSelectNode: (id: string) => void;
  className?: string;
}) {
  const { pm, tl } = useMemo(
    () => orderPmLeftTlRight(personA, personB),
    [personA, personB],
  );

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl bg-card p-4 ring-1 ring-foreground/10",
        className,
      )}
      data-slot="collaboration-relationship"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium">Selected relationship</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close relationship detail"
          className="rounded-md p-0.5 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <PersonHeading node={pm} onSelectNode={onSelectNode} />
        <span className="text-muted-foreground">↔</span>
        <PersonHeading node={tl} onSelectNode={onSelectNode} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <MetricCell
          label={edge.relationshipMetrics.isFutureFilter ? "From" : "Since"}
          value={formatDate(edge.relationshipMetrics.periodStartDate)}
        />
        <MetricCell
          label="Shared"
          value={edge.relationshipMetrics.sharedProjectsInRange}
        />
        <MetricCell
          label="Current"
          value={edge.relationshipMetrics.currentMonthProjects}
        />
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
          Shared projects
        </p>
        <ul className="flex flex-col gap-1">
          {sharedProjects.map((project) => (
            <li
              key={project.id}
              className="flex items-center justify-between gap-2 rounded-md bg-muted/20 px-2.5 py-1.5 text-xs"
            >
              <span className="truncate">
                {project.name && project.name !== project.key
                  ? `${project.key} — ${project.name}`
                  : project.key}
              </span>
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[0.65rem] capitalize text-muted-foreground">
                {project.type}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {sharedTeamMembers.length > 0 ? (
        <div className="mt-4">
          <p className="mb-1.5 text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
            Team members in common
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sharedTeamMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => onSelectNode(member.id)}
                className="hover:opacity-80"
              >
                <RoleBadge roleKey={member.roleKey} className="max-w-[8rem]">
                  {member.name}
                </RoleBadge>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
