// Resource: https://docs.uploadthing.com/nextjs/appdir#creating-your-first-fileroute
// Above resource shows how to setup uploadthing. Copy paste most of it as it is.
// We're changing a few things in the middleware and configs of the file upload i.e., "media", "maxFileCount"

import { currentUser } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

const getUser = async () => await currentUser();

export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  media: f({ 
    image: { maxFileSize: "4MB", maxFileCount: 5 },
    video: { maxFileSize: "16MB", maxFileCount: 3 },
    audio: { maxFileSize: "8MB", maxFileCount: 3 },
    pdf: { maxFileSize: "4MB", maxFileCount: 3 },
    text: { maxFileSize: "1MB", maxFileCount: 5 }
  })
    // Set permissions and file types for this FileRoute
    .middleware(async (req) => {
      try {
        console.log("UploadThing middleware called");
        // This code runs on your server before upload
        const user = await getUser();

        // If you throw, the user will not be able to upload
        if (!user) {
          console.error("UploadThing middleware: Unauthorized - no user found");
          throw new Error("Unauthorized");
        }

        console.log("UploadThing middleware: User authenticated", { userId: user.id });
        
        // Whatever is returned here is accessible in onUploadComplete as `metadata`
        return { userId: user.id };
      } catch (error) {
        console.error("Error in UploadThing middleware:", error);
        console.error("Error details:", {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace',
          name: error instanceof Error ? error.name : 'Unknown error type'
        });
        throw error;
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      try {
        console.log("UploadThing onUploadComplete called", { metadata, file });
        console.log("Upload complete for userId:", metadata.userId);
        console.log("file url", file.url);
        console.log("file key", file.key);
        console.log("file name", file.name);
        
        // Add a small delay to ensure any async operations complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Return success
        console.log("UploadThing callback completed successfully");
        return { 
          success: true,
          userId: metadata.userId,
          fileUrl: file.url,
          fileName: file.name
        };
      } catch (error) {
        console.error("Error in onUploadComplete:", error);
        console.error("Error details:", {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace',
          name: error instanceof Error ? error.name : 'Unknown error type',
          metadata,
          file
        });
        // Re-throw the error so UploadThing knows the callback failed
        throw error;
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;