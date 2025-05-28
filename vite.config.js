import { fileURLToPath, URL } from 'url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'



export default ({ mode }) => {
    // Load app-level env vars to node-level env vars.
    console.log(mode)
    process.env = {...process.env, ...loadEnv(mode, process.cwd())};
    console.log('PUBLIC URL: ' + process.env.VITE_PUBLIC_PATH)
    console.log('API URL: ' + process.env.VITE_API_PATH)

    return defineConfig({
      // To access env vars here use process.env.TEST_VAR
      plugins: [vue()],
      resolve: {
          alias: {
              '@': fileURLToPath(new URL('./src', import.meta.url))
          }
      },
      base: process.env.VITE_PUBLIC_PATH + '/',
      // this for Dagre build: https://github.com/vitejs/vite/issues/5759#issuecomment-1034461225
      build: {
        commonjsOptions: {
          ignoreTryCatch: false,
        }
      },
      //base: '/s/kukako/',
      //base: '/',
    //   base: process.env.NODE_ENV === 'production'
    // ? '/s/kukako/'
    // : '/',
    server: {
        port: 3000,
        proxy: {
            '/events': {
              target: 'http://localhost:8200',
              changeOrigin: true,
              ws: false,
              onProxyReq: (proxyReq, req, res) => {
                proxyReq.setHeader('Connection', 'keep-alive');
                proxyReq.setHeader('Accept', 'text/event-stream');
                proxyReq.setHeader('Accept-Encoding', 'identity');
              },
            },
              '/api': {
                   target: 'http://localhost:8200',
                   changeOrigin: true
                  
               },
               '/images': {
                    target: 'http://localhost:8200',
                    changeOrigin: true
                    
                },
                '/icons': {
                     target: 'http://localhost:8200',
                     changeOrigin: true
                     
                 }
          }
      }
    });
}

