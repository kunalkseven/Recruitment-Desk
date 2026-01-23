import type { Metadata } from 'next'
import { Providers } from '@/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Recruitment Desk - Hiring Made Simple',
  description: 'A modern recruitment management platform for tracking candidates, managing interviews, and streamlining the hiring process.',
  keywords: 'recruitment, hiring, ATS, applicant tracking, HR, candidates, interviews',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
