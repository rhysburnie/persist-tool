import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      name: 'PersistTool',
      entry: './src/PersistTool.js',
      filename: 'PersistTool'
    }
  }
});