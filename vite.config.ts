/**
 * Vite Configuration - Performance Optimized Build
 *
 * Optimizations Applied:
 * 1. Terser minification - Removes console logs in production, aggressive compression
 * 2. Source maps - For Sentry error tracking and development debugging
 * 3. ES2020 target - Modern browsers, smaller output
 * 4. Chunk size warnings - Helps identify large bundles
 * 5. Sentry integration - Automatic source map upload for production error tracking
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
import { sentryVitePlugin } from "@sentry/vite-plugin";

import type { PluginOption } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [
    react(),
  ];

  if (mode === 'development') {
    plugins.push(componentTagger());
  }

  if (mode === 'analyze') {
    plugins.push(
      visualizer({
        filename: './dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      })
    );
  }

  if (
    mode === 'production' &&
    process.env.VITE_SENTRY_DSN &&
    process.env.SENTRY_AUTH_TOKEN
  ) {
    plugins.push(
      sentryVitePlugin({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        sourcemaps: {
          assets: './dist/**',
          filesToDeleteAfterUpload: './dist/**/*.map',
        },
        telemetry: false,
      })
    );
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Production build optimizations
    build: {
      target: 'es2020', // Modern browsers only, smaller bundle
      sourcemap: true, // Generate source maps for Sentry (will be removed after upload in production)
      rollupOptions: {
        output: {
          sourcemapExcludeSources: false, // Include sources in source maps for Sentry
        },
      },
      // Terser minification options
      minify: 'terser',
      terserOptions: {
        compress: {
          // Remove console.log in production
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
          // Additional compression options
          passes: 2,
          pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
        },
        format: {
          // Remove comments in production
          comments: false,
        },
      },
      // Warn on chunks larger than 500kb
      chunkSizeWarningLimit: 500,
      // Optimize CSS code splitting
      cssCodeSplit: true,
    },
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
      ],
    },
  };
});
