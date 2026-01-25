import type { Metadata } from 'next';
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

export const metadata: Metadata = {
  title: 'こころのしるべ | 心の道標となる日記・夢記録・ウィッシュリスト管理',
  description:
    '日々の感情を記録し、夢をAIで占い、ウィッシュリストで目標を管理。あなたの心の道標となるサービスです。',
  keywords: ['日記', '夢占い', 'ウィッシュリスト', '感情記録', '目標管理', 'AI'],
  authors: [{ name: 'こころのしるべ' }],
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
