import { Metadata } from 'next';

export const defaultMetadata: Metadata = {
  icons: {
    icon: '/logos/logo_152x152.webp',
    shortcut: '/logos/logo_152x152.webp',
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') || ''
  ),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'Nextjs Template',
    images: [
      {
        url: '/og.jpeg',
      },
    ],
  },
  verification: {
    google: 'votre-code-verification-google',
    yandex: 'votre-code-verification-yandex',
  },
};
