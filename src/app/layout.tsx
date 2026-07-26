import type { Metadata } from "next";
import { Tangerine, Cormorant_Garamond, EB_Garamond } from "next/font/google";
import { BackgroundTexture } from "@/components/texture/BackgroundTexture";
import "./globals.css";

const tangerine = Tangerine({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-tangerine",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cormorant",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-eb",
});

export const metadata: Metadata = {
  title: "O Livro de Hellen & Cauan",
  description:
    "Convite digital em formato de livro antigo para o casamento de Hellen e Cauan.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${tangerine.variable} ${cormorant.variable} ${ebGaramond.variable} h-full`}>
      <body className="min-h-full">
        <BackgroundTexture />
        {children}
      </body>
    </html>
  );
}
