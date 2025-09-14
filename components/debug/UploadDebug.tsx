"use client";

import React, { useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";

export default function UploadDebug() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const { startUpload, isUploading } = useUploadThing("media");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      setUploadStatus(`Selected ${selectedFiles.length} file(s)`);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadStatus("No files selected");
      return;
    }

    try {
      setUploadStatus("Uploading...");
      const result = await startUpload(files);
      
      if (result && result[0]?.url) {
        setUploadStatus(`Upload successful: ${result[0].url}`);
        console.log("Upload result:", result);
      } else {
        setUploadStatus("Upload failed or no URL returned");
        console.log("Upload result:", result);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <div className="rounded-xl bg-dark-2 p-6">
      <h3 className="mb-4 text-heading4-medium text-light-1">Upload Debug Tool</h3>
      
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-small-regular text-light-2">
            Select Image File:
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full rounded-lg border border-gray-300 bg-dark-3 p-2 text-light-1"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={isUploading || files.length === 0}
          className="hover:bg-primary-600 rounded-lg bg-primary-500 px-4 py-2 text-white disabled:opacity-50"
        >
          {isUploading ? "Uploading..." : "Upload File"}
        </button>

        {uploadStatus && (
          <div className="mt-4 rounded-lg bg-dark-3 p-3">
            <p className="text-small-regular text-light-1">Status: {uploadStatus}</p>
          </div>
        )}
      </div>
    </div>
  );
}