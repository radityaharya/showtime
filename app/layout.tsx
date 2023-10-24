import "./globals.css";
import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { Providers } from "../components/provider";
import GradientBackground from "@/components/landing/GradientsBackground";

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
    </html>
  );
}
