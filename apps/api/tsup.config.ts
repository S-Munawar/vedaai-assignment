import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  target: 'ES2022',
  outDir: 'dist',
  clean: true,
  dts: false,
  shims: true,
  external: ['express', 'mongoose', 'cors', 'dotenv', 'firebase-admin', 'socket.io', 'zod', 'jose', 'bcryptjs'],
  esbuildOptions(options) {
    options.alias = {
      '@': './src',
    };
  },
});
