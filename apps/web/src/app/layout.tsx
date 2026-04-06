import type { Metadata } from "next";
import { Newsreader, Sora } from "next/font/google";
import { NavBar } from "../components/NavBar";
import "./globals.css";
import { Providers } from "./providers";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PalatePass | Trusted Restaurant Discovery",
  description:
    "Discover restaurants through trusted people, shared taste, and social recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sora.variable} ${newsreader.variable} antialiased pt-24 pb-12`}
        suppressHydrationWarning
      >
        <Providers>
          <NavBar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
