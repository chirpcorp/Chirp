"use client";

import * as z from "zod";
import { useState , ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { useUploadThing } from "@/lib/uploadthing";
import { isBase64Image } from "@/lib/utils";
import Image from "next/image";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { createCommunity } from "@/lib/actions/community.actions";
import ImageCropper from "@/components/shared/ImageCropper";

// Updated validation schema to make image and description optional
const CommunityValidation = z.object({
  name: z.string().min(3, { message: "Minimum 3 characters." }).max(50, { message: "Maximum 50 characters." }),
  username: z.string().min(3, { message: "Minimum 3 characters." }).max(30, { message: "Maximum 30 characters." }),
  description: z.string().max(500, { message: "Maximum 500 characters." }).optional(),
  image: z.string().optional(),
  isPrivate: z.boolean().optional().default(false),
});

interface Props {
  userId: string;
}

function CreateCommunityForm({ userId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { startUpload } = useUploadThing("media");
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [uploadDebug, setUploadDebug] = useState<string>("");
  const [showCropper, setShowCropper] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(CommunityValidation),
    defaultValues: {
      name: "",
      username: "",
      description: "",
      image: "",
      isPrivate: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof CommunityValidation>) => {
    try {
      setIsLoading(true);
      setError("");
      setUploadDebug("Starting community creation...");
      
      const blob = values.image || "";
      
      // Check if image has changed (is base64 data URL)
      const hasImageChanged = isBase64Image(blob);
      setUploadDebug(prev => prev + `\nHas image changed: ${hasImageChanged}`);
      
      if (hasImageChanged) {
        setUploadDebug(prev => prev + "\nImage has changed, uploading...");
        console.log("Image has changed, uploading...");
        const imgRes = await startUpload(files);
        
        setUploadDebug(prev => prev + `\nUpload result: ${JSON.stringify(imgRes)}`);
        console.log("Upload result:", imgRes);
        
        if (imgRes && imgRes[0]?.url) {
          setUploadDebug(prev => prev + `\nUpload successful: ${imgRes[0].url}`);
          console.log("Upload successful:", imgRes[0].url);
          values.image = imgRes[0].url;
        } else {
          setUploadDebug(prev => prev + "\nUpload failed or returned no URL, using default image");
          console.warn("Upload failed or returned no URL, using default image");
          values.image = "/assets/community-default.svg";
        }
      } else if (!values.image) {
        // If no image was provided at all, use default
        setUploadDebug(prev => prev + "\nNo image provided, using default");
        console.log("No image provided, using default");
        values.image = "/assets/community-default.svg";
      }

      setUploadDebug(prev => prev + `\nCreating community with image: ${values.image}`);
      console.log("Creating community with image:", values.image);

      await createCommunity({
        name: values.name,
        username: values.username,
        description: values.description || "",
        image: values.image,
        creatorId: userId,
        isPrivate: values.isPrivate || false,
        path: pathname,
      });

      setUploadDebug(prev => prev + "\nCommunity created successfully!");
      console.log("Community created successfully!");
      router.push("/communities");
    } catch (error: any) {
      console.error("Community creation error:", error);
      setUploadDebug(prev => prev + `\nError: ${error.message || "Unknown error"}`);
      setError(error.message || "Failed to create community. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImage = (
    e: ChangeEvent<HTMLInputElement>,
    fieldChange: (value: string) => void
  ) => {
    e.preventDefault();

    const fileReader = new FileReader();

    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFiles(Array.from(e.target.files));

      if (!file.type.includes("image")) {
        setError("Please select an image file (JPEG, PNG, GIF, etc.)");
        return;
      }

      fileReader.onload = async (event) => {
        const imageDataUrl = event.target?.result?.toString() || "";
        // Set temp image and show cropper instead of directly setting the field
        setTempImage(imageDataUrl);
        setShowCropper(true);
        setUploadDebug(prev => prev + `\nFile read complete, size: ${imageDataUrl.length} chars`);
      };

      fileReader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    // Only trigger file input when explicitly clicking the image area
    const fileInput = document.querySelector('.account-form_image-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    // Convert the cropped image to a file and update the form field
    fetch(croppedImage)
      .then(res => res.blob())
      .then(blob => {
        const croppedFile = new File([blob], "cropped-image.jpg", { type: "image/jpeg" });
        setFiles([croppedFile]);
        
        // Update the form field with the cropped image data URL
        form.setValue('image', croppedImage);
        
        // Close the cropper
        setShowCropper(false);
        setTempImage(null);
      });
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setTempImage(null);
  };

  return (
    <Form {...form}>
      <form
        className='flex flex-col justify-start gap-10'
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name='image'
          render={({ field }) => (
            <FormItem className='flex items-center gap-4'>
              <FormLabel 
                className='account-form_image-label cursor-pointer'
                onClick={handleImageClick}
              >
                {field.value ? (
                  <Image
                    src={field.value}
                    alt='community_icon'
                    width={96}
                    height={96}
                    priority
                    className='rounded-full object-contain'
                  />
                ) : (
                  <div className="flex size-24 items-center justify-center rounded-full bg-dark-3">
                    <Image
                      src='/assets/community.svg'
                      alt='community_icon'
                      width={24}
                      height={24}
                      className='object-contain'
                    />
                  </div>
                )}
              </FormLabel>
              <FormControl className='flex-1 text-base-semibold text-gray-200'>
                <Input
                  type='file'
                  accept='image/*'
                  placeholder='Add community image (optional)'
                  className='account-form_image-input hidden'
                  onChange={(e) => handleImage(e, field.onChange)}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem className='flex w-full flex-col gap-3'>
              <FormLabel className='text-base-semibold text-light-2'>
                Community Name *
              </FormLabel>
              <FormControl>
                <Input
                  type='text'
                  className='account-form_input no-focus'
                  placeholder='Enter community name'
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem className='flex w-full flex-col gap-3'>
              <FormLabel className='text-base-semibold text-light-2'>
                Username *
              </FormLabel>
              <FormControl>
                <Input
                  type='text'
                  className='account-form_input no-focus'
                  placeholder='@communityname'
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem className='flex w-full flex-col gap-3'>
              <FormLabel className='text-base-semibold text-light-2'>
                About (Optional)
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={6}
                  className='account-form_input no-focus'
                  placeholder='Describe your community...'
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='isPrivate'
          render={({ field }) => (
            <FormItem className='flex items-center gap-3'>
              <FormControl>
                <input
                  type='checkbox'
                  className='size-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500'
                  checked={field.value || false}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormLabel className='text-base-semibold text-light-2'>
                Private Community (Members need approval to join)
              </FormLabel>
            </FormItem>
          )}
        />

        <Button type='submit' className='bg-primary-500' disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Community"}
        </Button>
        
        {error && (
          <div className='mt-4 rounded-lg border border-red-500 bg-red-500/10 p-3'>
            <p className='text-sm text-red-400'>{error}</p>
          </div>
        )}
        
        {uploadDebug && (
          <div className='border-blue-500 bg-blue-500/10 mt-4 rounded-lg border p-3'>
            <p className='text-sm whitespace-pre-wrap text-blue-400'>{uploadDebug}</p>
          </div>
        )}
      </form>

      {/* Image Cropper Modal */}
      {showCropper && tempImage && (
        <ImageCropper
          src={tempImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </Form>
  );
}

export default CreateCommunityForm;