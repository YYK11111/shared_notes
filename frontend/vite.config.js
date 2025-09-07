import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [
        ElementPlusResolver(),
        IconsResolver({
          prefix: 'Icon'
        })
      ]
    }),
    Components({
      resolvers: [
        ElementPlusResolver(),
        IconsResolver({
          enabledCollections: ['ep']
        })
      ]
    }),
    Icons({
      autoInstall: true
    })
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      external: [
        'element-plus/es/components/loading-spinner/style/css'
      ]
    }
  },
  server: {
    port: 8080,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})