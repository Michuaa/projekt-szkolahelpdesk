import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const czcionkaBezszeryfowa = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const czcionkaOStalejSzerokosci = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Szkoła Helpdesk",
  description: "Panel szkolnego helpdesku",
};

export default function UkladGlowny({ children: zawartosc }) {
  return (
    <html
      lang="pl"
      className={`${czcionkaBezszeryfowa.variable} ${czcionkaOStalejSzerokosci.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{zawartosc}</body>
    </html>
  );
}
