export default function Sparkline({ values, className = '' }: { values: number[]; className?: string }) {
  if (values.length < 2) return null

  const W = 100
  const H = 28
  const pad = 3
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W
    const y = pad + (H - 2 * pad) * (1 - (v - min) / span)
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })

  const area = `0,${H} ${points.join(' ')} ${W},${H}`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={`h-7 w-full ${className}`}
      aria-hidden="true"
    >
      <polygon points={area} fill="currentColor" opacity={0.12} />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
