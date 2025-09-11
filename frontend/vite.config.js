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
      ],
      // 修复：正确排除mavon-editor，避免自动插件处理导致的兼容性问题
      exclude: [/mavon-editor/]
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
      strictPort: true, // 强制在8080端口启动
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      },
      open: true
    }
})