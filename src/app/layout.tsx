import type { ReactNode } from 'react';

import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';

import '@/app/globals.css';

// Montserrat, as on the SRE dashboard.
const montserrat = Montserrat({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-montserrat',
    display: 'swap'
});

export const metadata: Metadata = {
    title: 'Overname zaken Chiang Mai',
    description: 'Over te nemen zaken in Chiang Mai vergelijken: startkapitaal, break-even, winst en terugverdientijd.'
};

const Layout = ({ children }: Readonly<{ children: ReactNode }>) => {
    return (
        <html lang='nl'>
            <body className={`${montserrat.variable} text-foreground overscroll-none antialiased`}>{children}</body>
        </html>
    );
};

export default Layout;
