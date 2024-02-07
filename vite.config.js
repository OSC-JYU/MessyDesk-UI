import { fileURLToPath, URL } from 'url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'



export default ({ mode }) => {
    // Load app-level env vars to node-level env vars.
    process.env = {...process.env, ...loadEnv(mode, process.cwd())};
    console.log('PUBLIC URL: ' + process.env.VITE_PUBLIC_PATH)

    return defineConfig({
      // To access env vars here use process.env.TEST_VAR
      plugins: [vue()],
      resolve: {
          alias: {
              '@': fileURLToPath(new URL('./src', import.meta.url))
          }
      },
      base: process.env.VITE_PUBLIC_PATH + '/',
      //base: '/s/kukako/',
      //base: '/',
    //   base: process.env.NODE_ENV === 'production'
    // ? '/s/kukako/'
    // : '/',
    server: {
    
        proxy: {
            '/ws': {
                target: 'http://localhost:8200',
                changeOrigin: true,
                ws: true,
            },
              '/api': {
                   target: 'http://localhost:8200',
                   changeOrigin: true,
                   ws: true,
               },
               '/images': {
                    target: 'http://localhost:8200',
                    changeOrigin: true,
                    ws: true,
                },
                '/icons': {
                     target: 'http://localhost:8200',
                     changeOrigin: true,
                     ws: true,
                 }
          }
      }
    });
}

