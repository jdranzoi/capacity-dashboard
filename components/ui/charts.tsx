import { fmtPct, roundDisplayStat } from '@/lib/format/display-stats'

const SEMI_ARC_LEN = Math.PI * 40

export function Donut({
  pct,
  label,
  primaryCssVar,
  trackClassName = 'stroke-muted/40',
  subtitle,
}: {
  pct: number
  label: string
  primaryCssVar: string
  trackClassName?: string
  subtitle?: string
}) {
  const r = 36
  const c = 2 * Math.PI * r
  const p = Math.min(100, Math.max(0, roundDisplayStat(pct)))
  const dash = (p / 100) * c

  return (
    <div className="flex w-full max-w-sm flex-row items-center gap-3">
      <svg
        width={88}
        height={88}
        viewBox="0 0 100 100"
        className="-rotate-90 shrink-0"
        role="img"
        aria-label={`${label}: ${p} percent`}
      >
        <circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          className={trackClassName}
          strokeWidth={10}
        />
        <circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke={`var(${primaryCssVar})`}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="flex min-h-[88px] min-w-0 flex-1 flex-col justify-center gap-0.5 text-left">
        <p className="text-sm font-semibold tabular-nums text-foreground">
          {fmtPct(pct)}
        </p>
        <p className="text-[0.7rem] leading-tight text-muted-foreground">
          {label}
        </p>
        {subtitle ? (
          <p className="text-[0.65rem] leading-snug text-muted-foreground/90">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function SemiGauge({
  pct,
  title,
  goalLabel,
  primaryCssVar,
}: {
  pct: number | null
  title: string
  goalLabel: string | null
  primaryCssVar: string
}) {
  const p =
    pct === null ? 0 : Math.min(100, Math.max(0, roundDisplayStat(pct)))
  const dash = (p / 100) * SEMI_ARC_LEN

  return (
    <div className="flex w-full max-w-sm flex-row items-center gap-3">
      <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center">
        <svg
          width={88}
          height={53}
          viewBox="0 0 120 72"
          className="shrink-0"
          role="img"
          aria-label={
            pct === null ? `${title}: no data` : `${title}: ${p} percent`
          }
        >
          <path
            d="M 20 58 A 40 40 0 0 1 100 58"
            fill="none"
            className="stroke-muted/40"
            strokeWidth={10}
            strokeLinecap="round"
          />
          {pct !== null ? (
            <path
              d="M 20 58 A 40 40 0 0 1 100 58"
              fill="none"
              stroke={`var(${primaryCssVar})`}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${SEMI_ARC_LEN}`}
            />
          ) : null}
        </svg>
      </div>
      <div className="flex min-h-[88px] min-w-0 flex-1 flex-col justify-center gap-0.5 text-left">
        <p className="text-sm font-semibold tabular-nums text-foreground">
          {pct === null ? '—' : fmtPct(pct)}
        </p>
        <p className="text-[0.7rem] leading-tight text-muted-foreground">
          {title}
        </p>
        <p className="text-[0.7rem] leading-tight text-muted-foreground">
          {goalLabel}
        </p>
      </div>
    </div>
  )
}
