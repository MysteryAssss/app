import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { splitVendorChunkPlugin } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import fs from 'fs';

const hash = fs.readFileSync('public/definitions/hash.json', 'utf8');

export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';

  return {
    plugins: [
      react({
        babel: {
          plugins: [
            ['babel-plugin-styled-components', { displayName: true }]
          ],
        },
      }),
      createHtmlPlugin({
        inject: {
          data: {
            hash,
          },
        },
      }),
      splitVendorChunkPlugin(),
    ],
    assetsInclude: ['**/*.glb'],
    envDir: '.',
    server: {
      open: true,
    },
    resolve: {
      alias: {
        src: path.resolve(__dirname, './src'),
        assets: path.resolve(__dirname, './src/assets'),
      },
    },
    optimizeDeps: {
      include: ['@the-via/reader'],
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
        plugins: [],
      },
    },
    build: {
      minify: !isDevelopment,
      sourcemap: isDevelopment,
    },
  };
});
