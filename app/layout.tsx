import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { RoleProvider } from "@/lib/role";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClinicaShare — Gestão de repasses",
  description:
    "Plataforma web para gestão de consultas, profissionais e repasses financeiros da clínica multiprofissional do Dr. Edson.",
};

export const viewport: Viewport = {
  themeColor: "#257CFD",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <RoleProvider>{children}</RoleProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
