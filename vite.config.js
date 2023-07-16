import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      name: 'PersistTool',
      entry: './src/index.js',
      filename: 'PersistTool',
    },
  },
});
