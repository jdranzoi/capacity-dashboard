'use client'

import type { ReactNode } from 'react'

import { SegmentedControl } from '@/components/ui/segmented-control'
import {
  STAFF_FILTER_DETAIL_WIDTH,
  STAFF_FILTER_MODE_OPTIONS,
  type StaffFilterMode,
} from '@/lib/ui/staff-filter-mode'
import { TOOLBAR_FIELD_LABEL_CLASS } from '@/lib/ui/toolbar-field-label'
import { cn } from '@/lib/utils'

const fieldControlClass =
  'box-border h-8 w-full shrink-0 rounded-lg border border-border bg-muted/20 px-2.5 text-sm leading-none text-foreground ring-1 ring-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

function StaffFilterField({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <span className={TOOLBAR_FIELD_LABEL_CLASS}>{label}</span>
      {children}
    </div>
  )
}

export function RoleNameStaffFilter({
  mode,
  onModeChange,
  roleValue,
  onRoleChange,
  nameQuery,
  onNameQueryChange,
  roleOptions,
  className,
  detailClassName,
}: {
  mode: StaffFilterMode
  onModeChange: (mode: StaffFilterMode) => void
  roleValue: string
  onRoleChange: (value: string) => void
  nameQuery: string
  onNameQueryChange: (value: string) => void
  roleOptions: readonly string[]
  className?: string
  detailClassName?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-end gap-3', className)} data-slot="role-name-staff-filter">
      <SegmentedControl
        label="Filter by"
        value={mode}
        onChange={onModeChange}
        options={STAFF_FILTER_MODE_OPTIONS}
      />

      <div className={cn(STAFF_FILTER_DETAIL_WIDTH, detailClassName)}>
        {mode === 'role' ? (
          <StaffFilterField label="Role" className="w-full">
            <select
              value={roleValue}
              onChange={(e) => onRoleChange(e.target.value)}
              className={cn(fieldControlClass, 'appearance-none')}
            >
              <option value="">All roles</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </StaffFilterField>
        ) : (
          <StaffFilterField label="Person name" className="w-full">
            <input
              type="search"
              value={nameQuery}
              onChange={(e) => onNameQueryChange(e.target.value)}
              placeholder="Search people…"
              className={cn(fieldControlClass, 'placeholder:text-muted-foreground')}
            />
          </StaffFilterField>
        )}
      </div>
    </div>
  )
}
