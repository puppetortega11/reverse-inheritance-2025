import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Reverse Inheritance Trading Bot',
  description: 'Simple Solana trading bot interface',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
