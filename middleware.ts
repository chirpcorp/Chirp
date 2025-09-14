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

export default clerkMiddleware(async (auth, request) => {
  try {
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