"use client";

import {
  type ChangeEvent,
  useRef,
  useState,
  useTransition,
  type DragEvent,
} from "react";
import Image from "next/image";
import { uploadImage } from "@/utils/supabase/storage/client";
import { X, Upload } from "lucide-react";
import { toast } from "sonner";

interface UploadImageComponentProps {
  imageUrls: string[];
  setImageUrls: (newImageUrls: string[]) => void;
  folder?: string;
  allowMultiple?: boolean;
}

function UploadImageComponent({
  imageUrls,
  setImageUrls,
  folder,
  allowMultiple,
}: UploadImageComponentProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [numUploading, setNumUploading] = useState<number>(0);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isDragging, setIsDragging] = useState(false);

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

    setNumUploading(newImageUrls.length);

    // Automatically upload
    startTransition(async () => {
      const urls: string[] = [];

      for (const file of filesToProcess) {
        try {
          const { imageUrl, error } = await uploadImage({
            file,
            bucket: "images",
            folder,
          });

          if (!imageUrl) {
            toast.error(error);
            continue;
          } else {
            urls.push(imageUrl);
          }
        } catch (err) {
          console.error("Error processing image:", err);
        }
      }

      if (urls.length > 0) {
        setUploadedUrls((prev) =>
          allowMultiple ? [...prev, ...urls] : [urls[0]]
        );

        // populate parent component's fields
        if (allowMultiple) {
          setImageUrls([...imageUrls, ...urls]);
        } else {
          // For single item image
          setImageUrls([urls[0]]);
        }

        setNumUploading(0);
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

    // Then update parent component states
    setImageUrls(imageUrls.filter((url) => url !== removedUrl));
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

      {uploadedUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
          {/* Show uploaded images */}
          {uploadedUrls.map((url, index) => (
            <div
              key={index}
              className="relative aspect-video bg-gray-50 rounded-md border overflow-hidden group min-h-[150px]"
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

          {/* Show uploading previews */}
          {numUploading > 0 &&
            Array.from({ length: numUploading }, (_, i) => (
              <div key={i} className="relative bg-gray-100 rounded-md ">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default UploadImageComponent;
