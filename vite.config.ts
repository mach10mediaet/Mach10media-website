import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Keep the heavyweight SDKs out of the app chunk so the first
          // paint only pays for the shell + current view. Function form is
          // required: the `firebase` umbrella package has no root entry.
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (/[\\/](firebase|@firebase)[\\/]/.test(id)) return 'vendor-firebase';
              if (/[\\/]node_modules[\\/]motion[\\/]/.test(id) || /[\\/](framer-motion|motion-utils|motion-dom)[\\/]/.test(id)) return 'vendor-motion';
              if (/[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
            }
          },
        },
      },
    },
    server: {
      allowedHosts: ['estimator-upper-sullen.ngrok-free.dev'],
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
