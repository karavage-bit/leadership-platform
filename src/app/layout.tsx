import type { Metadata } from 'next'
import './globals.css'
import { ErrorBoundaryWrapper } from './error-boundary-wrapper'

export const metadata: Metadata = {
  title: 'Leadership 2.0 | Build Real Skills Through Real Action',
  description: 'A revolutionary leadership development platform for high school students',
  keywords: ['leadership', 'education', 'skills', 'development', 'high school'],
  authors: [{ name: 'Leadership 2.0' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <ErrorBoundaryWrapper>
          {children}
        </ErrorBoundaryWrapper>
      </body>
    </html>
  )
}
