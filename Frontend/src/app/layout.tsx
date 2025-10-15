// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { AuthProviderWrapper } from '@/components/AuthProviderWrapper';
import Script from 'next/script';
import ThemeInitializer from '@/components/ThemeInitializer';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SpendSmart',
  description: 'Tu app de finanzas personales',
};

/**
 * Script que se ejecuta ANTES de la hidratación de React.
 *  - Lee localStorage.theme (si está disponible).
 *  - Si no hay preferencia guardada, usa prefers-color-scheme.
 *  - Añade/remueve la clase 'dark' en document.documentElement.
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
  } catch (e) {
    // ignoramos errores (modo privado, bloqueos de localStorage, etc.)
  }
})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Ejecuta ANTES de que React hidrate para evitar mismatch */}
        <Script id="theme-initializer" strategy="beforeInteractive">
          {setInitialTheme}
        </Script>
        <ThemeInitializer />

        <AuthProviderWrapper>{children}</AuthProviderWrapper>
      </body>
    </html>
  );
}
