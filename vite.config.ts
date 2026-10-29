import { existsSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type Alias } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import tailwindcss from '@tailwindcss/vite'
import { createManualChunks } from 'optica-core/vite'


// In dev, use the local optica-core sources (../core/frontend) when they exist,
// so that changes in the core are picked up live. Builds always use the published package.
const localCore = fileURLToPath(new URL('../core/frontend', import.meta.url))
const localCoreSrc = `${localCore}/src`

// mirrors the "exports" map of core/frontend/package.json
const localCoreAliases: Alias[] = [
  { find: /^optica-core$/, replacement: `${localCoreSrc}/index.ts` },
  { find: /^optica-core\/ui\/(.*)$/, replacement: `${localCoreSrc}/components/ui/$1/index.ts` },
  { find: /^optica-core\/icons\/(.*)$/, replacement: `${localCoreSrc}/components/icons/$1.vue` },
  { find: /^optica-core\/assets\/(.*)$/, replacement: `${localCoreSrc}/assets/$1` },
]

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const useLocalCore = command === 'serve' && existsSync(localCoreSrc)
  if (useLocalCore) {
    console.log(`[optica-core] using local sources from ${localCore}`)
  }

  return {
    plugins: [
      vue(),
      vueJsx(),
      tailwindcss(),
    ],
    server: {
      watch: {
        usePolling: true,
        ignored: ["/node_modules/*"]
      },
      // the local core lives outside of this project's root
      fs: useLocalCore ? { allow: ['.', localCore] } : undefined,
    },
    resolve: {
      alias: [
        ...(useLocalCore ? localCoreAliases : []),
        { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      ],
      // the local optica-core has its own node_modules:
      // use a single copy of the libraries holding state (Vue reactivity, injection keys...)
      dedupe: ['vue', 'reka-ui', '@vueuse/core', '@tanstack/vue-query', 'vuedraggable', 'color', 'mathjs', 'axios'],
    },
    base: "./",
    build: {
      assetsDir: "static",
      rollupOptions: {
        output: {
          manualChunks: createManualChunks()
        },
      },
    }
  }
})
