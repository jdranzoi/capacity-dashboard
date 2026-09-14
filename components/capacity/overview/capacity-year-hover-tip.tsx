export function CapacityYearHoverTip({
  x,
  y,
  value,
  chartWidth,
}: {
  x: number
  y: number
  value: string
  chartWidth: number
}) {
  const boxW = Math.max(28, value.length * 5.6 + 10)
  const boxH = 14
  const left = Math.max(2, Math.min(x - boxW / 2, chartWidth - boxW - 2))
  const top = y - boxH - 6 < 1 ? y + 8 : y - boxH - 6

  return (
    <g pointerEvents="none">
      <rect
        x={left}
        y={top}
        width={boxW}
        height={boxH}
        rx={3}
        className="stroke-border"
        style={{ fill: 'var(--popover)' }}
      />
      <text
        x={left + boxW / 2}
        y={top + 10}
        textAnchor="middle"
        fill="var(--foreground)"
        className="tabular-nums"
      >
        {value}
      </text>
    </g>
  )
}
