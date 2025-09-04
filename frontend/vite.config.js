import vue from '@vitejs/plugin-vue'

export default {
  plugins: [vue()],
  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        // 确保正确的路径重写
        rewrite: (path) => path
      }
    }
  }
}
