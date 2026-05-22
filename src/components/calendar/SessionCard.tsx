'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { TrainingSession } from '@/types'
import { SPORT_COLORS, SPORT_ICONS, formatDuration } from '@/lib/utils'

export function SessionCard({ session, onClick }: { session: TrainingSession; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: session.id })

  const color = SPORT_COLORS[session.sport] ?? '#a3a3a3'
  const icon = SPORT_ICONS[session.sport] ?? '🏃'

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  const combinedStyle = {
    ...style,
    backgroundColor: `${color}18`,
    border: `1px solid ${color}35`,
    borderLeft: `3px solid ${color}`,
  }

  return (
    <div
      ref={setNodeRef}
      style={combinedStyle}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className="rounded-lg p-2 cursor-pointer hover:brightness-110 transition-all text-xs select-none"
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-[10px]">{icon}</span>
            <span className="font-medium text-white truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {session.title}
            </span>
          </div>
          {session.plannedDuration && (
            <div className="font-data text-[10px]" style={{ color: `${color}cc` }}>
              {formatDuration(session.plannedDuration)}
            </div>
          )}
        </div>
        <div className="flex gap-0.5 flex-shrink-0">
          {session.completed && <span title="Effectuée">✓</span>}
          {session.importedFrom && session.importedFrom !== 'manual' && <span title={`Importé de ${session.importedFrom}`}>🔗</span>}
          {session.coachNotes?.length ? <span title="Notes coach">💬</span> : null}
        </div>
      </div>
    </div>
  )
}
