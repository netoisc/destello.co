import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import dynamic from "next/dynamic";

const StarField3D = dynamic(
  () => import("@/components/starfield-3d"),
  { ssr: false }
);

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Destello - Invitaciones que brillan y desaparecen",
  description: "Crea invitaciones cósmicas que brillan y desaparecen después de 24 horas",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased relative bg-black">
        <StarField3D />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}

