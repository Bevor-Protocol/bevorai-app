import { Toaster } from "@/components/ui/sonner";
import QueryProvider from "@/providers/query";
import { AsyncComponent } from "@/utils/types";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import React from "react";
import "./globals.css";

const figtree = Figtree({ subsets: ["latin"] });

const baseURL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseURL),
  title: "BevorAI",
  description: "AI Agent Smart Contract Analyzer",
  keywords: ["AI Agent", "Analyzer", "Smart Contract", "web3", "Ethereum", "Solana"],
  openGraph: {
    title: "BevorAI",
    description: "AI Agent Smart Contract Analyzer",
    type: "website",
    url: baseURL,
    siteName: "BevorAI",
    locale: "en_US",
    images: [`${baseURL}/opengraph.png`],
  },
  twitter: {
    title: "BevorAI",
    description: "AI Agent Smart Contract Analyzer",
    card: "summary_large_image",
    site: "@CertaiK_Agent",
    creator: "@CertaiK_Agent",
    images: [`${baseURL}/opengraph.png`],
  },
};

const RootLayout: AsyncComponent<{ children: React.ReactNode }> = async ({ children }) => {
  return (
    <html lang="en">
      <body className={`${figtree.className} antialiased bg-sidebar`}>
        <QueryProvider>
          {children}
          <Analytics />
          <Toaster
            toastOptions={{
              classNames: {
                description: "!text-muted-foreground",
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
};

export default RootLayout;
