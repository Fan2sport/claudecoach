'use client'

type Status = 'excellent' | 'on_track' | 'possible' | 'ambitious' | 'risky'

const STATUS_COLORS: Record<Status, string> = {
  excellent: '#22c55e',
  on_track: '#84cc16',
  possible: '#f59e0b',
  ambitious: '#f97316',
  risky: '#ef4444',
}

const STATUS_LABELS: Record<Status, string> = {
  excellent: 'Excellent',
  on_track: 'En bonne voie',
  possible: 'Atteignable',
  ambitious: 'Ambitieux',
  risky: 'Risqué',
}

export function ConfidenceChip({ score, status }: { score: number; status: Status }) {
  const color = STATUS_COLORS[status]
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium font-data"
      style={{ borderColor: `${color}40`, backgroundColor: `${color}10`, color }}
    >
      <span>{score}%</span>
      <span className="text-[10px] opacity-80">{STATUS_LABELS[status]}</span>
    </div>
  )
}
