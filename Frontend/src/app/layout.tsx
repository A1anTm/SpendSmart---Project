// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { AuthProviderWrapper } from '@/components/AuthProviderWrapper';
import Script from 'next/script';
import { cookies } from 'next/headers';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SpendSmart',
  description: 'Tu app de finanzas personales',
};

/**
 * Fallback script (antes de hydration) — lo dejamos como fallback, pero la cookie
 * es la principal fuente para que el servidor ponga la clase en el HTML.
 */
const setInitialTheme = `(function() {
  try {
    var theme = null;
    try { theme = localStorage.getItem('theme'); } catch (e) { theme = null; }
    var prefersDark = false;
    try { prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; } catch(e) { prefersDark = false; }

    if (theme === 'dark' || (!theme && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();`;

/**
 * RootLayout es async para poder await cookies() en el servidor.
 */
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // <-- aquí usamos await
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('theme')?.value;
  const htmlClass = themeCookie === 'dark' ? 'dark' : '';

  return (
    <html lang="es" className={htmlClass}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Ejecuta ANTES de que React hidrate — fallback si no hay cookie */}
        <Script id="theme-initializer" strategy="beforeInteractive">
          {setInitialTheme}
        </Script>

        <AuthProviderWrapper>{children}</AuthProviderWrapper>
      </body>
    </html>
  );
}
