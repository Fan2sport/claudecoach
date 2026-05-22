import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AthleteX — Coaching multi-sports',
  description: 'Application de coaching sportif personnalisé multi-sports',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
