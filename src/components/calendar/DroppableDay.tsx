'use client'

import { useDroppable } from '@dnd-kit/core'

export function DroppableDay({ id, children }: { id: string; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={`transition-colors ${isOver ? 'ring-1 ring-[#ff3b30]/50 rounded-xl' : ''}`}
    >
      {children}
    </div>
  )
}
