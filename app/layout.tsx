import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { WalletProvider } from "@/context/WalletContext";
import ClientOverlays from "@/components/ClientOverlays";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SegarTani - Sayur & Buah Organik Segar Berkualitas",
  description: "SegarTani menyediakan pilihan sayuran dan buah organik segar langsung dari petani lokal di Batu, Jawa Timur.",
  keywords: ["sayur organik", "buah segar", "agribisnis", "SegarTani", "makanan sehat"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://qjfuebkxlnnrdjgakdrm.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://qjfuebkxlnnrdjgakdrm.supabase.co" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <NotificationProvider>
          <WalletProvider>
            <CartProvider>
              <WishlistProvider>
                <Navbar />
                <main className="flex-grow pt-20">
                  {children}
                </main>
                <Footer />
                <ClientOverlays />
              </WishlistProvider>
            </CartProvider>
          </WalletProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}
