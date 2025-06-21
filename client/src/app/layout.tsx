import { Providers } from '@/components/providers'
import { AuthProvider } from '@/contexts/AuthContext'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Challenz - Social Challenges, Films & Real Estate NFTs',
  description: 'A platform combining social challenges, short films, and real estate tokenization through NFTs',
  keywords: ['social challenges', 'short films', 'NFT', 'real estate', 'blockchain', 'ethereum'],
  authors: [{ name: 'Challenz Team' }],
  openGraph: {
    title: 'Challenz Platform',
    description: 'Combining social challenges, short films, and real estate NFTs',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Challenz Platform',
    description: 'Combining social challenges, short films, and real estate NFTs',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
