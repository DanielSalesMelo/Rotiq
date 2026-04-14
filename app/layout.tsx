import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { Providers } from '@/components/Providers'
import { AuthButton } from '@/components/AuthButton'
const inter = Inter({ subsets: ['latin'] })
export const metadata: Metadata = { title: 'Rotiq', description: 'Gestão Inteligente' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <Providers>
          <Toaster position="top-right" />
          <header className="border-b bg-white">
            <nav className="container mx-auto flex items-center justify-between px-4 py-3">
              <h1 className="text-2xl font-bold text-gray-800">Rotiq</h1>
              <AuthButton />
            </nav>
          </header>
          <main className="container mx-auto p-4">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
