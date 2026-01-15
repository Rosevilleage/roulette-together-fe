import type { Metadata } from 'next';
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

export const metadata: Metadata = {
  title: '룰렛 투게더 - 실시간 다인 랜덤 뽑기',
  description: '친구들과 함께 실시간으로 랜덤 뽑기를 해보세요'
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
