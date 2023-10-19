'use client'

import './globals.css'
import React, { useEffect } from 'react';
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SideBar } from './components/sideBar'
import { usePathname, useRouter } from 'next/navigation'
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

const font = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dental Agenda'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/notSign");
      }
    });

    return () => unsubscribe();
  }, []);

  if (pathname === '/notSign') {
    return (
      <html lang="en">
        <body className={` ${font.className}`}>
          <div>
            {children}
          </div>
        </body>
      </html>
    );
  } else {
    return (
      <html lang="en">
        <body className={`bg-zinc-300 overflow-hidden	 ${font.className}`}>
          <div >
            <SideBar></SideBar>
            {children}
          </div>
        </body>
      </html>
    )

  }

}
