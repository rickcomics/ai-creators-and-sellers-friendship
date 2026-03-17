//import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'Биржа AI-карточек | Заказать и создать',
  description: 'Платформа для заказа и создания AI-карточек. Продавцы находят креаторов, креаторы зарабатывают.',
  keywords: 'AI карточки, дизайн, фриланс, биржа, заказать карточку',
  authors: [{ name: 'Rick Comics' }],
  openGraph: {
    title: 'Биржа AI-карточек',
    description: 'Платформа для заказа и создания AI-карточек',
    url: 'https://ai-creators-and-sellers-friendship-51wzw3ksn.vercel.app',
    siteName: 'Биржа AI-карточек',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Биржа AI-карточек'
      }
    ],
    locale: 'ru_RU',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Биржа AI-карточек',
    description: 'Платформа для заказа и создания AI-карточек',
    images: ['/og-image.link.png']
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico'
  }
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}


