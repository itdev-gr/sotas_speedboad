// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://rentaboatzakynthos.com',
  output: 'static',
  adapter: vercel(),
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de', 'fr', 'it'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/login') &&
        !page.includes('/dashboard') &&
        !page.includes('/api/') &&
        !page.includes('/book-license-free') &&
        !page.includes('/book-with-skipper'),
      // SSR (prerender=false) localized pages the crawler can't auto-discover.
      customPages: ['de', 'fr', 'it', 'ru', 'el'].flatMap((lang) =>
        ['license-free-rent', 'rent-with-skipper', 'recommended-routes'].map(
          (p) => `https://rentaboatzakynthos.com/${lang}/${p}`
        )
      ),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/analytics'],
    },
    ssr: {
      noExternal: ['firebase'],
    },
  },
});
