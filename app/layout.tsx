import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Clínica Bem Estar — Cuidados de saúde de excelência",
  description:
    "A Clínica Bem Estar combina experiência clínica, tecnologia inovadora e uma abordagem centrada no paciente para um diagnóstico preciso e tratamento eficaz.",
  keywords: ["clínica", "saúde", "consultas", "médicos", "bem estar"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" className={`${jakarta.variable} ${outfit.variable}`}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
