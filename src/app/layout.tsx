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
      <body className={inter.className}>{children}</body>
    </html>
  );
}
