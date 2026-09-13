import { CapacityYearKpiCard } from '@/components/capacity/overview/capacity-year-kpi-card'
import type { CapacityYearPayload } from '@/lib/capacity/overview/capacity-year-types'
import { yearCompareColorVar } from '@/lib/ui/year-compare-colors'
import { cn } from '@/lib/utils'

export function CapacityYearSection({ data }: { data: CapacityYearPayload }) {
  const years = [
    ...new Set(data.cards.flatMap((card) => card.years.map((row) => row.year))),
  ].sort((a, b) => b - a)

  return (
    <section className="space-y-3" data-slot="capacity-year-section">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Year
          </p>
          <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
            Same-period {data.throughLabel} versus prior years. Full year when the year is closed.
          </p>
        </div>
        {years.length > 1 ? (
          <ol className="flex flex-wrap gap-x-3 gap-y-1 text-[0.7rem] text-muted-foreground">
            {years.map((year) => (
              <li key={year} className="flex items-center gap-1.5">
                <span
                  className="inline-block size-1.5 rounded-full"
                  style={{ background: yearCompareColorVar(year, data.currentYear) }}
                />
                <span
                  className={cn(year === data.currentYear && 'font-medium')}
                  style={{ color: yearCompareColorVar(year, data.currentYear) }}
                >
                  {year}
                </span>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.cards.map((card) => (
          <CapacityYearKpiCard
            key={card.key}
            card={card}
            currentYear={data.currentYear}
            throughMonthIndex={data.throughMonthIndex}
            periodHeader={data.throughLabel}
          />
        ))}
      </div>
    </section>
  )
}
