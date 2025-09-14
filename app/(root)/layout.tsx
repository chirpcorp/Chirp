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
  // Add error boundary for debugging
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    console.error("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set in root layout");
  }
  
  if (!process.env.CLERK_SECRET_KEY) {
    console.error("CLERK_SECRET_KEY is not set in root layout");
  }

  if (!process.env.MONGODB_URL) {
    console.error("MONGODB_URL is not set in root layout");
  }

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

          <main className='flex w-full flex-row'>
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