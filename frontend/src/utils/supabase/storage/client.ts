import imageCompression from "browser-image-compression";
import { createClient } from "../client";

/**
 * `uploadImage` is an asynchronous function that uploads an IMAGE file to a specified
 * bucket in Supabase storage.
 *
 * @remarks
 * This functions is used in the `UploadImageComponent` component to upload images to Supabase storage.
 * It compresses large images files to a maximum size of 1MB before uploading (Supabase Storage has limit
 * on the size of files that can be uploaded). Then, it constructs the public URL for the uploaded image.
 *
 * @param file - The image file to be uploaded.
 * @param bucket - The name of the Supabase storage bucket ("images" ) where the image will be uploaded.
 * @param folder - A folder (e.g fundraisers, items) path within the bucket where the image will be stored.
 */
export const uploadImage = async ({
  file,
  bucket,
  folder,
}: {
  file: File;
  bucket: string;
  folder?: string;
}): Promise<
  | {
      imageUrl: string;
      error: null;
    }
  | {
      imageUrl: null;
      error: string;
    }
> => {
  const fileName = file.name;
  const path = `${folder ? folder + "/" : ""}${fileName}`;

  try {
    file = await imageCompression(file, {
      maxSizeMB: 1,
    });
  } catch (error) {
    console.error(error);
    return {
      imageUrl: null,
      error: "Error compressing image",
    };
  }

  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file);

  if (error) {
    console.error(error.message);

    return {
      imageUrl: null,
      error: `Error uploading image: ${error.message}`,
    };
  }
  const imageUrl = `${process.env
    .NEXT_PUBLIC_SUPABASE_URL!}/storage/v1/object/public/${bucket}/${
    data.path
  }`;

  return { imageUrl, error: null };
};

/**
 * `deleteImage` is an asynchronous function that deletes an image file from a specified
 * bucket in Supabase storage.
 *
 * @remarks
 * This functions is used in the `UploadImageComponent` component to delete images from Supabase storage
 * when the user removes an image. It extracts the path from the full URL if necessary,
 *
 * @param bucket - The name of the Supabase storage bucket ("images" ) where the image is stored
 * @param path - The path to the image file in the bucket. This can be a full URL or just the path.
 */
export const deleteImage = async ({
  bucket,
  path,
}: {
  bucket: string;
  path: string;
}): Promise<
  | {
      success: true;
      error: null;
    }
  | {
      success: false;
      error: string;
    }
> => {
  // If no path is provided, return an error
  if (!path) {
    return {
      success: false,
      error: "No path provided for image deletion",
    };
  }

  const supabase = createClient();

  // Perform the deletion
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    console.error("Error deleting image:", error.message);
    return {
      success: false,
      error: `Error deleting image: ${error.message}`,
    };
  }

  return {
    success: true,
    error: null,
  };
};
