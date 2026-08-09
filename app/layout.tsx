import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono, Newsreader } from "next/font/google";
import { SmoothScroll } from "@/components/SmoothScroll";
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
    default: "FrameInGoa — HH Goa 2026 Builder Card Generator",
    template: "%s · FrameInGoa",
  },
  description:
    "Upload a photo, get your own HH Goa 2026 Builder card — front, back, portrait or landscape. Download it or share to X.",
  applicationName: "FrameInGoa",
  keywords: [
    "HH Goa 2026",
    "hackathon",
    "builder card",
    "ID card",
    "builder",
    "#FrameInGoa",
  ],
  openGraph: {
    title: "FrameInGoa — HH Goa 2026",
    description:
      "Upload a photo → your own HH Goa 2026 Builder card in seconds. Download or share to X.",
    siteName: "FrameInGoa",
    type: "website",
    images: [
      {
        url: "/og?orientation=portrait&side=front",
        width: 1200,
        height: 630,
        alt: "HH Goa 2026 FrameInGoa — frame your Goa era",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og?orientation=portrait&side=front"],
  },
};

export const viewport: Viewport = {
  themeColor: "#046835",
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
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
