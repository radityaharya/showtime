import "./globals.css";
import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import { Providers } from "../components/provider";
import GradientBackground from "@/components/landing/GradientsBackground";

// const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en" className="dark">
      <body>
        <GradientBackground showGradient={true} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
