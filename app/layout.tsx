import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono, Newsreader } from "next/font/google";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FrameInGoa — HH Goa 2026 Frame & ID Card Generator",
    template: "%s · FrameInGoa",
  },
  description:
    "Upload a photo, get a branded HH Goa 2026 PFP frame or Builder ID card in seconds. Download it or share to X with #FrameInGoa pre-filled.",
  applicationName: "FrameInGoa",
  keywords: [
    "HH Goa 2026",
    "hackathon",
    "PFP frame",
    "ID card",
    "builder",
    "#FrameInGoa",
  ],
  openGraph: {
    title: "FrameInGoa — HH Goa 2026",
    description:
      "Upload a photo → branded HH Goa 2026 PFP frame or Builder ID card in seconds. Download or share to X with #FrameInGoa.",
    siteName: "FrameInGoa",
    type: "website",
    images: [
      {
        url: "/og?format=pfp&variant=sunset",
        width: 1200,
        height: 630,
        alt: "HH Goa 2026 FrameInGoa — frame your Goa era",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og?format=pfp&variant=sunset"],
  },
};

export const viewport: Viewport = {
  themeColor: "#2a6b45",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${jetbrains.variable} ${newsreader.variable}`}
    >
      <body className="min-h-dvh bg-void font-body text-ink antialiased">
        <SmoothScroll />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
