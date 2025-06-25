'use client';

import '@/i18n/config';
import './globals.css';
import { Inter } from 'next/font/google';
import { useTranslation } from 'react-i18next';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { i18n } = useTranslation();

  return (
    <html lang={i18n.language}>
      <body className={`${inter.className} overflow-x-hidden`}>
        <div className="min-w-[320px] overflow-x-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
