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

export const metadata: Metadata = {
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
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0e0c",
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
