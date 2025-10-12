import { Inter } from 'next/font/google';
import './globals.css';
import { LocalSEO } from '@/components/seo/LocalSEO';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CBX - Carbon Credit Exchange',
  description: 'The future of carbon credits is here. Retire carbon credits in any amount you want with blockchain verification and NFT receipts.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="">
      <head>
        <LocalSEO />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'light';
                document.documentElement.classList.add(theme);
                document.documentElement.style.colorScheme = theme;
              } catch (e) {
                document.documentElement.classList.add('light');
                document.documentElement.style.colorScheme = 'light';
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className}`} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}