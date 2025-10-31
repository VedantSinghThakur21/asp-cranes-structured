import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';
// @ts-ignore - Import the JS file directly
import noServerModules from './src/plugins/noServerModules.js';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Get correct production status
  const isProduction = mode === 'production' || process.env.NODE_ENV === 'production';

  // Polyfill __dirname for ESM
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  console.log(`Building for ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);

  // Configure production-specific optimizations
  return {
    plugins: [
      noServerModules(), // Must be first plugin
      react(),
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
      include: ['zustand', 'zustand/middleware'],
    },
    define: {
      // Define global constants to be replaced at build time
      __PROD__: isProduction,
      __DEV__: !isProduction,
    },
    resolve: {
      alias: {
        'pg-promise': '/src/shims/pg-promise.js',
        'pg': '/src/shims/pg.js',
        './lib/dbClient.js': '/src/shims/dbClient.js',
        '../lib/dbClient.js': '/src/shims/dbClient.js',
        '../../lib/dbClient.js': '/src/shims/dbClient.js',
        'dotenv': '/src/shims/dotenv.js',

        // Backend service imports should be handled by API calls in production
        // These imports point to the backend services, but for frontend builds
        // we need to provide stubs or redirect to API calls
        // KEEP templateService active for frontend API calls
        '../services/leadService': isProduction
          ? '/src/shims/emptyModule.js'
          : '/src/services/lead.ts',
        '../services/jobService': isProduction
          ? '/src/shims/emptyModule.js'
          : '/src/services/job.ts',
        '../services/customerService': isProduction
          ? '/src/shims/emptyModule.js'
          : '/src/services/customer.ts',
        '../services/quotationService': isProduction
          ? '/src/shims/emptyModule.js'
          : '/src/services/quotation.ts',
        '../services/userService': isProduction
          ? '/src/services/userService.ts'
          : '/src/services/userService.ts',
        '../../services/postgresAuthService': isProduction
          ? '/src/shims/emptyModule.js'
          : '/src/services/authService.ts',
        '../services/siteAssessmentService': isProduction
          ? '/src/shims/emptyModule.js'
          : '/src/shims/emptyModule.js',
        '../services/serviceManagementService': isProduction
          ? '/src/shims/emptyModule.js'
          : '/src/shims/emptyModule.js',
        '../services/dealService': isProduction
          ? '/src/shims/emptyModule.js'
          : '/src/services/deal.ts',
        '../services/configService': '/src/services/configService.ts',
        '../services/equipmentService': isProduction
          ? '/src/shims/emptyModule.js'
          : '/src/services/equipment.ts',
        '../../utils/debugHelper': isProduction
          ? '/src/shims/emptyModule.js'
          : '/src/services/debugHelper.ts',
        '../utils/customerUtils': isProduction
          ? '/src/shims/emptyModule.js'
          : '/src/services/customerUtils.ts',
        '../services/jobApiClient': isProduction
          ? '/src/shims/emptyModule.js'
          : '/src/services/job.ts',
        '../../services/jobApiClient': isProduction
          ? '/src/shims/emptyModule.js'
          : '/src/services/job.ts',
        '../../services/templateService': '/src/services/template.ts',
        '../../services/notificationService': isProduction
          ? '/src/shims/emptyModule.js'
          : '/src/services/notification.ts',
        '../../utils/apiHeaders': isProduction
          ? '/src/shims/emptyModule.js'
          : '/src/services/apiHeaders.ts',
        '../../services/customerService': isProduction
          ? '/src/shims/emptyModule.js'
          : '/src/services/customer.ts',
        '../../services/activityService': isProduction
          ? '/src/shims/emptyModule.js'
          : '/src/shims/emptyModule.js',

        // Exclude development utilities in production builds
        ...(isProduction
          ? {
              './utils/devLogin': path.resolve(__dirname, 'src/shims/emptyModule.js'),
              '../utils/devLogin': path.resolve(__dirname, 'src/shims/emptyModule.js'),
              '../../utils/devLogin': path.resolve(__dirname, 'src/shims/emptyModule.js'),
              '/src/utils/devLogin': path.resolve(__dirname, 'src/shims/emptyModule.js'),
              'src/utils/devLogin': path.resolve(__dirname, 'src/shims/emptyModule.js'),
              './utils/authDebug': path.resolve(__dirname, 'src/shims/emptyModule.js'),
              '../utils/authDebug': path.resolve(__dirname, 'src/shims/emptyModule.js'),
              '../../utils/authDebug': path.resolve(__dirname, 'src/shims/emptyModule.js'),
              '/src/utils/authDebug': path.resolve(__dirname, 'src/shims/emptyModule.js'),
              'src/utils/authDebug': path.resolve(__dirname, 'src/shims/emptyModule.js'),
              'src/services/devLogin': path.resolve(__dirname, 'src/shims/emptyModule.js'),
              'src/services/authDebug': path.resolve(__dirname, 'src/shims/emptyModule.js'),
              'src/services/cleanupForProduction': path.resolve(
                __dirname,
                'src/shims/emptyModule.js'
              ),
              'src/services/productionValidator': path.resolve(
                __dirname,
                'src/shims/emptyModule.js'
              ),
              './utils/devCleanup': path.resolve(__dirname, 'src/shims/emptyModule.js'),
              '../utils/devCleanup': path.resolve(__dirname, 'src/shims/emptyModule.js'),
              '../../utils/devCleanup': path.resolve(__dirname, 'src/shims/emptyModule.js'),
              '/src/utils/devCleanup': path.resolve(__dirname, 'src/shims/emptyModule.js'),
              'src/utils/devCleanup': path.resolve(__dirname, 'src/shims/emptyModule.js'),
            }
          : {}),
      },
    },
    server: {
      historyApiFallback: true,
      proxy: {
        '/api': {
          target: import.meta.env.VITE_API_URL || 'http://backend:3001',
          changeOrigin: true,
          secure: false,
          configure: proxy => {
            // Log proxy errors in full detail
            proxy.on('error', (err, req) => {
              console.error('Proxy error:', err);
              console.error('Request url:', req.url);
            });

            proxy.on('proxyReq', (proxyReq, req) => {
              console.log(`Proxying ${req.method} request to: ${proxyReq.path}`);
            });

            proxy.on('proxyRes', (proxyRes, req) => {
              console.log(`Received from proxy: ${proxyRes.statusCode} for ${req.url}`);
            });
          },
        },
      },
    },
  };
});
