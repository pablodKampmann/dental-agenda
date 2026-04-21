import './globals.css'
import type { Metadata } from 'next'
import { Navigation } from '../components/general/navigation/navigation'
import { Inter as FontSans } from "next/font/google"
import { cn } from "@/lib/utils"
import { AuthProvider } from '../context/AuthContext'

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: 'Dental Agenda — Panel de Administración',
  description: 'Panel de administración para gestión de turnos, pacientes y facturación del consultorio dental.',
  icons: {
    icon: '/Diente.png',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-white text-white bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <AuthProvider>
          <div className='w-full h-screen overflow-y-hidden'>
            <Navigation />
            <div className='mt-[68px] sm:ml-56'>
              {children}
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  )

}
