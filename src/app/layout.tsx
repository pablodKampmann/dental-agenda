import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SideBar } from './../components/general/sideBar'
import { getUserAuth } from "./../components/auth/getUserAuth";

const font = Inter({ subsets: ['latin'] })
export const metadata: Metadata = {
  title: 'Admin Panel',
  description: '...',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const userAuth = await getUserAuth();
  console.log(userAuth);
  console.log("putos");
  
  
  return (
    <html lang="en">
      <body className={`bg-white ${font.className}`}>
        <div>
          <SideBar />
          {children}
        </div>
      </body>
    </html>
  )

}
