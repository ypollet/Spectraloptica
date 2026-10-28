import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    tailwindcss(),
  ],
  server: {
    watch: {
      usePolling: true,
      ignored: ["/node_modules/*"]
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    // @optica/core is linked from ../core/frontend, which has its own node_modules:
    // use a single copy of the libraries holding state (Vue reactivity, injection keys...)
    dedupe: ['vue', 'reka-ui', '@vueuse/core', '@tanstack/vue-query', 'vuedraggable', 'color', 'mathjs', 'axios'],
  },
  base: "./",
  build: {
    assetsDir: "static",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        },
      },
    },
  }
})
