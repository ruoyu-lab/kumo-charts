import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';
import { defaultClientConditions, defineConfig, type Plugin } from 'vite';
import { docsPlugin } from './build/plugin';

const examples = resolve(import.meta.dirname, 'src/examples');
const examplesCore = resolve(examples, 'core.ts');

/**
 * In the live examples a chart created without a theme follows the site's theme: what imports
 * `@kumo-charts/core` gets `src/examples/core.ts`, which itself gets the core.
 */
const liveCore: Plugin = {
  name: 'live-examples-core',
  enforce: 'pre',
  resolveId: (source, importer) =>
    source === '@kumo-charts/core' && importer !== examplesCore ? examplesCore : null
};

export default defineConfig({
  root: import.meta.dirname,
  appType: 'mpa',
  plugins: [
    // The documentation, or the pages of the tests with DOCS_DIR=test/fixtures/docs.
    docsPlugin({ docsDir: process.env.DOCS_DIR ?? 'content' }),
    liveCore,
    vue()
  ],
  resolve: {
    conditions: ['@kumo-charts/source', ...defaultClientConditions],
    // The library's packages and the site take their frameworks from the workspace: one copy of each.
    dedupe: ['vue', 'react', 'react-dom'],
    alias: [{ find: '@docs/data', replacement: resolve(examples, 'data.ts') }]
  },
  build: {
    outDir: process.env.DOCS_OUT_DIR ?? 'dist',
    emptyOutDir: true
  },
  server: {
    port: 5186
  },
  preview: {
    port: 4186
  }
});
