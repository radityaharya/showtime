/* eslint-disable no-undef */
import "./globals.css";
import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { Providers } from "../components/provider";
import GradientBackground from "@/components/landing/GradientsBackground";
import Script from "next/script";

const open_sans = Open_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Showtime",
  description: "Keep track of your favorite shows and movies with showtime.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${open_sans.className}`}>
      <body>
        <GradientBackground showGradient={true} />
        <Providers>{children}</Providers>
      </body>
      <Script
        defer
        src="https://analytics.radityaharya.com/script.js"
        data-website-id="9b181ad6-b354-491b-9267-6079d12ae457"
      ></Script>
    </html>
  );
}
