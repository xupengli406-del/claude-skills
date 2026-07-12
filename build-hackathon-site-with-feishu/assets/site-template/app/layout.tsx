import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const title = "黑客松活动名称｜报名官网";
  const description = "黑客松活动介绍、赛道、日程、评委、奖项与报名入口。";
  return {
    metadataBase: base,
    title,
    description,
    icons: {
      icon: [{ url: "/favicon.svg?v=2", type: "image/svg+xml" }],
      shortcut: "/favicon.svg?v=2",
    },
    openGraph: { title, description, type: "website", images: [new URL("/hackathon-assets/hero-terrain-base.webp", base)] },
    twitter: { card: "summary_large_image", title, description, images: [new URL("/hackathon-assets/hero-terrain-base.webp", base)] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
