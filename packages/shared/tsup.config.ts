import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    auth: 'src/auth.ts',
    assignment: 'src/assignment.ts',
    notification: 'src/notification.ts',
    schools: 'src/schools.ts',
  },
  format: ['esm'],
  target: 'ES2022',
  outDir: 'dist',
  clean: true,
  dts: true,
  shims: true,
});
