import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { AIAssistantSidebar } from '@/components/assistant'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CareerMatch AI - Your Intelligent Job Search Partner',
  description: 'AI-powered job search assistant tailored for the New Zealand market. Find, match, and optimize your job applications with intelligent insights.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <AIAssistantSidebar />
        </Providers>
      </body>
    </html>
  )
}
