import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { parse } from 'yaml';

// The sets and the list of options are YAML files. They are read while
// building, so the applet carries their contents and the page loads no parser.
const yaml = {
  name: 'yaml',
  transform(code, id) {
    if (!/\.ya?ml$/.test(id.split('?')[0])) return null;
    return {
      code: `export default ${JSON.stringify(parse(code))};`,
      map: null
    };
  }
};

// `npm run dev` serves the demo page, index.html. `npm run build` writes the
// applet to dist/var-reverberation.js, one file with everything it needs, and
// the demo page beside it. The model is the submodule's source, built with the
// applet, and uses the applet's copies of React and three.js.
export default defineConfig({
  plugins: [react(), yaml],
  base: './',
  resolve: {
    alias: {
      'lib-var-viewer-js': fileURLToPath(
        new URL('./lib/lib-var-viewer-js/src/index.js', import.meta.url)
      )
    },
    dedupe: [
      'react',
      'react-dom',
      'three',
      '@react-three/fiber',
      '@react-three/drei'
    ]
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: { entryFileNames: 'var-reverberation.js' }
    }
  }
});
