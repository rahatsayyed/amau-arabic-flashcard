import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, Noto_Serif, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import BottomNav from '@/components/BottomNav';
import { ThemeProvider } from '@/components/ThemeProvider';

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
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
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
        {/* Anti-flash: set dark class before first paint */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem('amau_theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}` }} />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body
        className={`${beVietnamPro.variable} ${sourceSerif4.variable} ${notoSerif.variable} bg-stone-300 dark:bg-stone-900 flex justify-center items-start font-body-md text-on-surface`}
      >
        <ThemeProvider>
          {/* Phone shell — 390px centred on desktop, full-width on mobile */}
          <div className="phone-shell w-full h-dvh bg-surface flex flex-col">
            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
            {/* Bottom nav always visible at bottom of shell */}
            <BottomNav />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
