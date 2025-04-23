"use client";
import {
  type ChangeEvent,
  useRef,
  useState,
  useTransition,
  type Dispatch,
  type SetStateAction,
  type DragEvent,
} from "react";
import Image from "next/image";
import { UploadImage } from "@/utils/supabase/storage/client";
import type { CreateFundraiserItemBody, CreateFundraiserBody } from "common";
import { X, Upload } from "lucide-react";
import type { z } from "zod";
import { convertBlobUrlToFile } from "@/lib/urlToFile";

interface UploadImageComponentProps {
  setImageUrl?:
    | Dispatch<
        SetStateAction<z.infer<typeof CreateFundraiserItemBody>["imageUrl"]>
      >
    | Dispatch<
        SetStateAction<z.infer<typeof CreateFundraiserBody>["imageUrls"]>
      >;
  folder?: string;
}

function UploadImageComponent({
  setImageUrl,
  folder,
}: UploadImageComponentProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);

  // Determine if multiple selection is allowed
  const allowMultiple = folder === "fundraisers";

  const processFiles = async (files: File[]) => {
    if (!files.length) return;

    // Filter for only image files
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    // For single image upload, only use the first image
    const filesToProcess = allowMultiple ? imageFiles : [imageFiles[0]];

    const newImageUrls = filesToProcess.map((file) =>
      URL.createObjectURL(file)
    );

    // Set preview URLs
    setPreviewUrls(newImageUrls);

    // Automatically upload
    startTransition(async () => {
      const urls: string[] = [];

      for (const url of newImageUrls) {
        try {
          const file = await convertBlobUrlToFile(url);
          const { imageUrl, error } = await UploadImage({
            file,
            bucket: "images",
            folder,
          });

          if (error) {
            console.error("Upload error:", error);
            continue;
          }

          urls.push(imageUrl);
        } catch (err) {
          console.error("Error processing image:", err);
        }
      }

      if (urls.length > 0) {
        setUploadedUrls((prev) =>
          allowMultiple ? [...prev, ...urls] : [urls[0]]
        );

        if (setImageUrl) {
          if (allowMultiple) {
            // For fundraiser images
            (setImageUrl as Dispatch<SetStateAction<string[]>>)((prev) => {
              const prevArray = Array.isArray(prev) ? prev : [];
              return [...prevArray, ...urls];
            });
          } else {
            // For single item image
            (setImageUrl as Dispatch<SetStateAction<string | undefined>>)(
              urls[0]
            );
          }
        }
        setPreviewUrls([]);
      }
    });
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const filesArray = Array.from(e.target.files);
    await processFiles(filesArray);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      await processFiles(filesArray);
    }
  };

  const removeUploadedImage = (indexToRemove: number) => {
    // Get the URL that's being removed
    const removedUrl = uploadedUrls[indexToRemove];

    // Update local state first
    const newUrls = uploadedUrls.filter((_, index) => index !== indexToRemove);
    setUploadedUrls(newUrls);

    // Then update parent states using the same setter with appropriate typing
    if (setImageUrl) {
      if (allowMultiple) {
        // For fundraiser images
        (setImageUrl as Dispatch<SetStateAction<string[]>>)((prevUrls) =>
          prevUrls.filter((url) => url !== removedUrl)
        );
      } else if (newUrls.length === 0) {
        // For single item image
        (setImageUrl as Dispatch<SetStateAction<string | undefined>>)(
          undefined
        );
      }
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        hidden
        multiple={allowMultiple}
        ref={imageInputRef}
        onChange={handleImageChange}
        accept="image/*"
        disabled={isPending}
      />

      <div
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging
            ? "border-primary bg-primary/10"
            : "border-gray-300 hover:border-primary/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => imageInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <Upload className="h-10 w-10 text-gray-400" />
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-primary cursor-pointer">
              Click to upload
            </span>{" "}
            or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            {allowMultiple ? "Upload multiple images" : "Upload a single image"}
          </p>
          {isPending && (
            <div className="mt-2">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-gray-500 mt-1">Uploading...</p>
            </div>
          )}
        </div>
      </div>

      {/* Show uploading previews */}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
          {previewUrls.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square bg-gray-100 rounded-md"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show uploaded images */}
      {uploadedUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
          {uploadedUrls.map((url, index) => (
            <div
              key={index}
              className="relative aspect-video bg-gray-50 rounded-md border overflow-hidden group"
              style={{ minHeight: "150px" }}
            >
              <Image
                src={url || "/placeholder.svg"}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                alt={`Uploaded image ${index + 1}`}
                className="object-contain p-1"
              />
              <button
                type="button"
                onClick={() => removeUploadedImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UploadImageComponent;
