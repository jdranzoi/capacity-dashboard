import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { WeeklyHeadline } from '@/lib/overview/load-weekly-overview'

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}h</span>
    </div>
  )
}

export function WeeklyHeadlineSection({
  monthLabel,
  asOfDate,
  weeks,
}: {
  monthLabel: string
  asOfDate: string | null
  weeks: WeeklyHeadline[]
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold">Weekly metrics</h2>
        <CardDescription>
          Net capacity, planned, and availability are monthly snapshot values (latest sync) split across
          weeks by Mon–Fri; worklogs and PTO are from Tempo. Non-PTO billable and logged for {monthLabel}
          {asOfDate ? ` (worklogs through ${asOfDate})` : ''}. Planned hours exclude PTO plan lines.
        </CardDescription>
      </div>
      {weeks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No weeks in this month range.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {weeks.map((w) => (
            <Card key={w.weekStart} size="sm">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-sm">{w.weekLabel}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 pt-3 text-sm">
                <Row label="Net capacity" value={w.netCapacityHours} />
                <Row label="Planned" value={w.plannedHours} />
                <Row label="Availability" value={w.availabilityHours} />
                <Row label="PTO" value={w.ptoHours} />
                <Row label="Billable" value={w.billableHours} />
                <Row label="Logged" value={w.loggedHours} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
