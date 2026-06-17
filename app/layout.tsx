import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, Noto_Serif, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import BottomNav from '@/components/BottomNav';

const beVietnamPro = Be_Vietnam_Pro({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-be-vietnam',
  display: 'swap',
});

const sourceSerif4 = Source_Serif_4({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-source-serif',
  display: 'swap',
});

const notoSerif = Noto_Serif({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-noto-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AMĀU Arabic — Learn with FSRS',
  description: 'Learn Arabic vocabulary from AMAU Academy using spaced repetition.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#17363b',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body
        className={`${beVietnamPro.variable} ${sourceSerif4.variable} ${notoSerif.variable} bg-stone-300 flex justify-center items-start font-body-md text-on-surface`}
      >
        {/* Phone shell — 390px centred on desktop, full-width on mobile */}
        <div className="w-full max-w-[390px] h-dvh bg-surface shadow-2xl flex flex-col">
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
          {/* Bottom nav always visible at bottom of shell */}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
