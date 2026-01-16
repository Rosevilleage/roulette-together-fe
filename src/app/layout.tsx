import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Noto_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import { cn } from '@/shared/lib/utils';
import { Providers } from './providers';

const notoSans = Noto_Sans({ variable: '--font-sans' });

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
});

const siteConfig = {
  name: '당첨?당첨!',
  title: '당첨?당첨! - 실시간 랜덤 뽑기',
  description: '친구들과 함께 실시간으로 랜덤 뽑기를 해보세요',
  url: process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://roulette-together.com',
  locale: 'ko_KR'
};

export const metadata: Metadata = {
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  keywords: ['룰렛', '랜덤 뽑기', '실시간', '다인 게임', '팀 뽑기', '무작위 선택'],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: siteConfig.title
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
    images: ['/og-image.png']
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml', sizes: '512x512' }
    ],
    apple: '/icon.svg'
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: siteConfig.name
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={notoSans.variable}>
      <body className={cn(geistSans.variable, geistMono.variable, 'antialiased h-dvh')}>
        <Providers>
          {children}
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
