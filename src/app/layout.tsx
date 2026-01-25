import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: '#a0522d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'こころのしるべ | 心の道標となる日記・夢記録・ウィッシュリスト管理',
  description:
    '日々の感情を記録し、夢をAIで占い、ウィッシュリストで目標を管理。あなたの心の道標となるサービスです。',
  keywords: ['日記', '夢占い', 'ウィッシュリスト', '感情記録', '目標管理', 'AI'],
  authors: [{ name: 'こころのしるべ' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'こころのしるべ',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'こころのしるべ | 心の道標となる日記・夢記録・ウィッシュリスト管理',
    description:
      '日々の感情を記録し、夢をAIで占い、ウィッシュリストで目標を管理。あなたの心の道標となるサービスです。',
    type: 'website',
    locale: 'ja_JP',
    siteName: 'こころのしるべ',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'こころのしるべ | 心の道標となる日記・夢記録・ウィッシュリスト管理',
    description:
      '日々の感情を記録し、夢をAIで占い、ウィッシュリストで目標を管理。あなたの心の道標となるサービスです。',
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
