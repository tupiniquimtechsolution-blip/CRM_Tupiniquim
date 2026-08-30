import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CRM Tupiniquim", template: "%s | CRM Tupiniquim" },
  description: "Operação comercial completa da Tupiniquim Tech Solutions.",
  applicationName: "CRM Tupiniquim",
};

export const viewport: Viewport = {
  themeColor: "#020617",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
