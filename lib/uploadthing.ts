// Fixed imports for @uploadthing/react v7.3.3
import { generateReactHelpers, generateUploadButton } from "@uploadthing/react";

import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();
export const UploadButton = generateUploadButton<OurFileRouter>();