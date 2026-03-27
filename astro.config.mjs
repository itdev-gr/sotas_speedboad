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
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/login') &&
        !page.includes('/dashboard') &&
        !page.includes('/api/') &&
        !page.includes('/book-license-free') &&
        !page.includes('/book-with-skipper'),
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
