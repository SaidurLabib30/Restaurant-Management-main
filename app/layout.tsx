import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Copper Fork',
  description: 'Restaurant Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full bg-paper text-ink font-body antialiased">
        {children}
      </body>
    </html>
  );
}