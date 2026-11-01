import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  const url = env.VITE_SUPABASE_URL?.trim()
  const key = env.VITE_SUPABASE_ANON_KEY?.trim()
  if (Boolean(url) !== Boolean(key) || (command === 'build' && env.VERCEL === '1' && (!url || !key))) {
    throw new Error('Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY antes de compilar en Vercel. En local puedes omitir ambas para usar el modo local.')
  }
  if (url && !/^https?:\/\//.test(url)) {
    throw new Error('VITE_SUPABASE_URL debe ser una URL HTTP(S).')
  }
  return {
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  }
})
