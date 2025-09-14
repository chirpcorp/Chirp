import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";

import "../globals.css";
import LeftSidebar from "@/components/shared/LeftSidebar";
import Bottombar from "@/components/shared/Bottombar";
import RightSidebar from "@/components/shared/RightSidebar";
import Topbar from "@/components/shared/Topbar";
import HydrationFix from "@/components/shared/HydrationFix";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chirp",
  description: "Chirp as you like",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang='en' suppressHydrationWarning={true}>
        <head>
          <Script
            src="/theme-init.js"
            strategy="beforeInteractive"
          />
        </head>
        <body className={inter.className} suppressHydrationWarning={true}>
          <HydrationFix />
          <Topbar />

          <main className='flex flex-row w-full'>
            <LeftSidebar />
            <section className='main-container flex-1'>
              <div className='w-full max-w-4xl pb-16 md:pb-0'>{children}</div>
            </section>
            {/* @ts-ignore */}
            <RightSidebar />
          </main>

          <div className="md:hidden">
            <Bottombar />
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}