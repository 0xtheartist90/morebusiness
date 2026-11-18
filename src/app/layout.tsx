import type { ReactNode } from 'react';

import type { Metadata } from 'next';
import { Montserrat, Noto_Sans_Thai } from 'next/font/google';

import '@/app/globals.css';

// Montserrat, as on the SRE dashboard.
const montserrat = Montserrat({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-montserrat',
    display: 'swap'
});

// Montserrat has no Thai letters; Thai text falls through to this font.
const thai = Noto_Sans_Thai({
    subsets: ['thai'],
    weight: ['400', '500', '600', '700'],
    variable: '--font-thai',
    display: 'swap'
});

export const metadata: Metadata = {
    title: 'Business takeovers Chiang Mai',
    description: 'Compare businesses for sale in Chiang Mai: start investment, break-even, profit and payback time.'
};

const Layout = ({ children }: Readonly<{ children: ReactNode }>) => {
    return (
        <html lang='en'>
            <body className={`${montserrat.variable} ${thai.variable} text-foreground overscroll-none antialiased`}>
                {children}
            </body>
        </html>
    );
};

export default Layout;
