import imageCompression from "browser-image-compression";
import { createClient } from "../client";

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
