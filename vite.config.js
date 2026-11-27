import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' 로 두면 빌드 결과를 어느 주소에 올려도 열려요 (미리보기용).
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { host: true, port: 5173 },
});
