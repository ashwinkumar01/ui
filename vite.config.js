import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [sveltekit()],
  optimizeDeps: ['date-fns', 'date-fns-tz'],
  resolve: {
    alias: {
      $types: path.resolve('./src/types'),
      $holocene: path.resolve('./src/lib/holocene'),
      $fixtures: path.resolve('./src/fixtures'),
    },
  },
};

export default config;