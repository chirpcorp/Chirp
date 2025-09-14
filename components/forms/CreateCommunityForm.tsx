"use client";

import * as z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { useUploadThing } from "@/lib/uploadthing";
import { isBase64Image } from "@/lib/utils";
import Image from "next/image";
import { ChangeEvent } from "react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { createCommunity } from "@/lib/actions/community.actions";

const CommunityValidation = z.object({
  name: z.string().min(3, { message: "Minimum 3 characters." }).max(50, { message: "Maximum 50 characters." }),
  username: z.string().min(3, { message: "Minimum 3 characters." }).max(30, { message: "Maximum 30 characters." }),
  description: z.string().min(3, { message: "Minimum 3 characters." }).max(500, { message: "Maximum 500 characters." }),
  image: z.string().url().nonempty(),
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
      
      const blob = values.image;
      const hasImageChanged = isBase64Image(blob);

      if (hasImageChanged) {
        const imgRes = await startUpload(files);
        if (imgRes && imgRes[0].url) {
          values.image = imgRes[0].url;
        }
      }

      await createCommunity({
        name: values.name,
        username: values.username,
        description: values.description,
        image: values.image,
        creatorId: userId,
        isPrivate: values.isPrivate,
        path: pathname,
      });

      router.push("/communities");
    } catch (error: any) {
      setError(error.message || "Failed to create community. Please try again.");
      console.error("Community creation error:", error);
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

      if (!file.type.includes("image")) return;

      fileReader.onload = async (event) => {
        const imageDataUrl = event.target?.result?.toString() || "";
        fieldChange(imageDataUrl);
      };

      fileReader.readAsDataURL(file);
    }
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
              <FormLabel className='account-form_image-label'>
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
                  <Image
                    src='/assets/community.svg'
                    alt='community_icon'
                    width={24}
                    height={24}
                    className='object-contain'
                  />
                )}
              </FormLabel>
              <FormControl className='flex-1 text-base-semibold text-gray-200'>
                <Input
                  type='file'
                  accept='image/*'
                  placeholder='Add community image'
                  className='account-form_image-input'
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
                Community Name
              </FormLabel>
              <FormControl>
                <Input
                  type='text'
                  className='account-form_input no-focus'
                  placeholder='Enter community name'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem className='flex w-full flex-col gap-3'>
              <FormLabel className='text-base-semibold text-light-2'>
                Username
              </FormLabel>
              <FormControl>
                <Input
                  type='text'
                  className='account-form_input no-focus'
                  placeholder='@communityname'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem className='flex w-full flex-col gap-3'>
              <FormLabel className='text-base-semibold text-light-2'>
                About
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={6}
                  className='account-form_input no-focus'
                  placeholder='Describe your community...'
                  {...field}
                />
              </FormControl>
              <FormMessage />
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
                  className='h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500'
                  checked={field.value}
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
          <div className='mt-4 p-3 bg-red-500/10 border border-red-500 rounded-lg'>
            <p className='text-red-400 text-sm'>{error}</p>
          </div>
        )}
      </form>
    </Form>
  );
}

export default CreateCommunityForm;