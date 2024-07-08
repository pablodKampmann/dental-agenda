import './globals.css'
import type { Metadata } from 'next'
import { Navigation } from '../components/general/navigation/navigation'
import { Inter as FontSans } from "next/font/google"
import { cn } from "@/lib/utils"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: 'Admin Panel',
  description: '...',
  
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (  
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-white text-white bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <div>
          <Navigation />
          {children}
        </div>
      </body>
    </html>
  )

}
