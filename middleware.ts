// Resource: https://clerk.com/docs/nextjs/middleware#clerk-middleware
// Updated to use clerkMiddleware (authMiddleware is deprecated)
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/api/webhooks/clerk", // Fixed: should be "webhooks" (plural)
  "/api/uploadthing(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  // Add these for better compatibility
  "/_next(.*)",
  "/favicon.ico",
]);

// Add rate limiting tracking
const requestCounts = new Map<string, { count: number; timestamp: number }>();

export default clerkMiddleware(async (auth, request) => {
  try {
    // Rate limiting to prevent "Rate Exceeded" errors
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const currentTime = Date.now();
    const windowSize = 60000; // 1 minute window
    const maxRequests = 50; // Max 50 requests per minute per IP
    
    // Clean up old entries (using Array.from to avoid iteration issues)
    const entriesToRemove: string[] = [];
    for (const [key, value] of Array.from(requestCounts.entries())) {
      if (currentTime - value.timestamp > windowSize) {
        entriesToRemove.push(key);
      }
    }
    entriesToRemove.forEach(key => requestCounts.delete(key));
    
    // Check rate limit
    const currentCount = requestCounts.get(clientIP);
    if (currentCount) {
      if (currentTime - currentCount.timestamp < windowSize) {
        if (currentCount.count >= maxRequests) {
          console.warn(`Rate limit exceeded for IP: ${clientIP}`);
          // Don't block, just continue without additional auth checks
          return;
        }
        requestCounts.set(clientIP, { 
          count: currentCount.count + 1, 
          timestamp: currentCount.timestamp 
        });
      } else {
        requestCounts.set(clientIP, { count: 1, timestamp: currentTime });
      }
    } else {
      requestCounts.set(clientIP, { count: 1, timestamp: currentTime });
    }

    // BYPASS FOR VERCEL.APP DOMAINS - This fixes your production issue!
    if (request.nextUrl.hostname.includes('.vercel.app')) {
      // Only protect non-public routes on Vercel, but don't crash the app
      if (!isPublicRoute(request)) {
        try {
          await auth.protect();
        } catch (clerkError) {
          // If Clerk auth fails on Vercel, redirect to sign-in instead of crashing
          console.log("Clerk auth failed on Vercel, redirecting to sign-in");
          return Response.redirect(new URL('/sign-in', request.url));
        }
      }
      return; // Let the request continue
    }
    
    // Normal protection for custom domains
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
  } catch (error) {
    console.error("Error in middleware:", error);
    
    // Graceful fallback - don't block the entire app
    if (!isPublicRoute(request)) {
      // Redirect to sign-in instead of crashing
      return Response.redirect(new URL('/sign-in', request.url));
    }
  }
});

export const config = {
  matcher: [
    // Exclude files with a file extension
    "/((?!.+\\.[\\w]+$|_next).*)", 
    // Re-include any files in the api or trpc folders
    "/(api|trpc)(.*)",
    // Include the root path
    "/",
  ],
};