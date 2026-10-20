/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const appVersion = Date.now().toString(36);

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(appVersion) },
  plugins: [react(), {
    name: 'app-version',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: appVersion }) });
    },
  }],
  // Относительный base — чтобы собранный сайт одинаково работал что на
  // GitHub Pages (адрес вида username.github.io/AlexViet/), что на любом
  // другом хостинге в подпапке или в корне. В сайте нет client-side
  // роутинга по URL (вся навигация — состояние React), поэтому
  // относительные пути ничего не ломают.
  base: './',
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
