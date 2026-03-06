import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Memorial 2026 - El Reto",
  description: "Participa en el reto de apuestas deportivas del Memorial 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${lexend.variable} font-[var(--font-lexend)] antialiased bg-[#0a120d] text-white min-h-screen`}
        style={{ fontFamily: "'Lexend', sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
