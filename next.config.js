/** @type {import('next').NextConfig} */
const nextConfig = {
  // Essential for Vercel deployment
  output: 'standalone',
  
  // Enable source maps for better debugging (remove in final production)
  productionBrowserSourceMaps: true,
  
  // Essential environment variables
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    // Add your specific env vars here
  },
  
  // For authentication and database libraries
  experimental: {
    serverComponentsExternalPackages: [
      '@prisma/client',
      'bcryptjs',
      'jsonwebtoken',
      // Add any other packages causing Server Component issues
    ],
  },
  
  // Webpack config for common auth/database libraries
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Fix for common auth library issues
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
      'supports-color': 'commonjs supports-color',
    });
    
    // Handle node modules in client-side bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    return config;
  },
  
  // Image optimization settings
  images: {
    domains: [
      'localhost',
      'your-domain.vercel.app',
      // Add domains for external images
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      'platform-lookaside.fbsbx.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
    ],
  },
  
  // Headers for Clerk webhooks and API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, svix-id, svix-timestamp, svix-signature' },
        ],
      },
      {
        source: '/api/webhooks/clerk',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://api.clerk.com' },
          { key: 'Access-Control-Allow-Methods', value: 'POST' },
          { key: 'Access-Control-Allow-Headers', value: 'svix-id, svix-timestamp, svix-signature' },
        ],
      },
    ];
  },
  
  // Redirects for auth routes
  async redirects() {
    return [
      {
        source: '/signin',
        destination: '/auth/signin',
        permanent: true,
      },
      {
        source: '/signup',
        destination: '/auth/signup',
        permanent: true,
      },
    ];
  },
  
  // Compress responses
  compress: true,
  
  // Power pack features
  swcMinify: true,
  
  // Strict mode
  reactStrictMode: true,
  
  // ESLint config
  eslint: {
    // Only run ESLint on these directories during production builds
    dirs: ['pages', 'utils', 'components', 'lib', 'app'],
  },
  
  // TypeScript config
  typescript: {
    // Skip type checking during builds if you want faster deploys
    // ignoreBuildErrors: true,
  },
}

export default nextConfig