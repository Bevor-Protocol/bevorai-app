import { PrivyWrapper } from "@/providers/privy";
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

};

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(baseURL),
    title: "BevorAI",
    description: "AI Agent Smart Contract Auditor",
    keywords: ["AI Agent", "Auditor", "Smart Contract", "web3", "Ethereum", "Solana"],
    openGraph: {
      title: "BevorAI",
      description: "AI Agent Smart Contract Auditor",
      type: "website",
      url: baseURL,
      siteName: "BevorAI",
      locale: "en_US",
      images: [`${baseURL}/opengraph.png`],
    },
    twitter: {
      title: "BevorAI",
      description: "AI Agent Smart Contract Auditor",
      card: "summary_large_image",
      site: "@BevorAI_Agent",
      creator: "@BevorAI_Agent",
      images: [`${baseURL}/opengraph.png`],
    },
      other: {
      "fc:miniapp": JSON.stringify({
          version: "next",
          imageUrl: "https://pbs.twimg.com/profile_images/1886423225925533696/KRveUwhh_400x400.jpg",
          button: {
              title: "Bevor Mini App",
              action: {
                  type: "bevor_miniapp",
                  name: "Bevor Mini App",
                  url: "certaik-app-git-feat-base-mini-app-support-bevor.vercel.app",
                  splashImageUrl: "https://pbs.twimg.com/profile_banners/1862890581896163328/1738593320/1500x500",
                  splashBackgroundColor: "#000000",
              },
          },
      }),
      },
  };
};

const RootLayout: AsyncComponent<{ children: React.ReactNode }> = async ({ children }) => {
  return (
    <html lang="en">
      <body className={`${figtree.className} antialiased`}>
        <QueryProvider>
          <PrivyWrapper>
            {children}
            <Analytics />
          </PrivyWrapper>
        </QueryProvider>
      </body>
    </html>
  );
};

export default RootLayout;
