import { defineConfig } from 'vite';
import { resolve } from 'path';

/** @see dokumentasi/STRUKTUR_PROJECT.md */
export default defineConfig({
    root: resolve(__dirname),
    server: {
        port: 5173,
        strictPort: true,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
            },
            '/storage': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
            },
        },
    },
    preview: {
        port: 4173,
        proxy: {
            '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
            '/storage': { target: 'http://127.0.0.1:8000', changeOrigin: true },
        },
    },
});
