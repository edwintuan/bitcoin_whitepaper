import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

/**
 * Asks the browser for the display face before it has read the stylesheet.
 * The hero title is the first thing drawn and is set in it; fetched late, it
 * arrives after first paint and the title is drawn twice.
 */
function preloadFonts(files: RegExp): Plugin {
  return {
    name: 'preload-fonts',
    transformIndexHtml: {
      order: 'post',
      handler(_html, context) {
        // The dev server has no bundle to look in; fonts reach it through the module graph.
        if (!context.bundle) return [];
        return Object.keys(context.bundle)
          .filter((file) => files.test(file))
          .map((file) => ({
            tag: 'link',
            attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `./${file}`, crossorigin: '' },
            injectTo: 'head' as const,
          }));
      },
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), preloadFonts(/anton-latin-400-normal-[\w-]+\.woff2$/)],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // The port the screenshot and audit scripts look at unless told otherwise.
  server: { port: 5199 },
  preview: { port: 5198 },
  build: {
    rolldownOptions: {
      output: {
        // One file would be 650 kB of everything. Split by how often each part
        // changes: the libraries almost never, the copy with every edit.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 30 },
            { name: 'controls', test: /node_modules[\\/](react-aria|react-aria-components|react-stately|@react-aria|@react-stately|@react-types|@internationalized)[\\/]/, priority: 20 },
            { name: 'copy', test: /[\\/]src[\\/](content|glossary[\\/]terms)/, priority: 10 },
          ],
        },
      },
    },
  },
});
