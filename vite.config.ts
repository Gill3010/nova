import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Opciones del proxy tipadas como 'any' porque la propiedad 'router' existe
// en http-proxy (librería subyacente de Vite) pero no está declarada en los
// tipos públicos de Vite ProxyOptions.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ojsProxyOptions: any = {
  target: 'https://dev.relaticpanama.org/_journals',
  changeOrigin: true,
  // Enrutamiento dinámico: lee el encabezado x-ojs-base-url enviado por el cliente
  router: (req: any) => {
    const targetHeader = req.headers['x-ojs-base-url'];
    if (typeof targetHeader === 'string' && targetHeader.trim() !== '') {
      return targetHeader.replace(/\/+$/, '');
    }
    return 'https://dev.relaticpanama.org/_journals';
  },
  rewrite: (path: string) => path.replace(/^\/ojs-api/, ''),
  secure: true,
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ojs-api': ojsProxyOptions
    }
  }
})

