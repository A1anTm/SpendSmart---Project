'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

    export default function ThemeInitializer() {
    const pathname = usePathname();

    useEffect(() => {
        try {
        const saved = (() => { try { return localStorage.getItem('theme'); } catch { return null; } })();
        const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (saved === 'dark' || (!saved && prefersDark)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        } catch (e) {
        // ignore
        }
    }, [pathname]);

    return null;
    }