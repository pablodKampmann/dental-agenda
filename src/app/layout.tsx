import './globals.css'
import React from 'react';
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SideBar } from './components/style/sideBar'

const font = Inter({ subsets: ['latin'] })
export const metadata: Metadata = {
  title: 'Admin Panel',
  description: '...',
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {



  return (
    <html lang="en">
      <body className={`bg-white ${font.className}`}>
        <div>
          <SideBar></SideBar>
          {children}
        </div>
      </body>
    </html>
  )

}
