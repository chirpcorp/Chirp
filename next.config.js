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
  serverExternalPackages: [
    '@prisma/client',
    'bcryptjs',
    'jsonwebtoken',
    'mongoose',
    // Add any other packages causing Server Component issues
  ],
  
  // Image optimization settings
  images: {
    domains: [
      'localhost',
      'your-domain.vercel.app',
      // Add domains for external images
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      'platform-lookaside.fbsbx.com',
      'utfs.io', // UploadThing file storage
      'img.clerk.com', // Clerk user images
      'images.clerk.dev', // Clerk user images
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io', // UploadThing file storage
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com', // Clerk user images
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev', // Clerk user images
        pathname: '/**',
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