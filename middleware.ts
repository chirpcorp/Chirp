// Resource: https://clerk.com/docs/nextjs/middleware#clerk-middleware
// Updated to use clerkMiddleware (authMiddleware is deprecated)

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/api/webhook/clerk",
  "/api/uploadthing(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)"
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};