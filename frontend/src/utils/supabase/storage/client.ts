import imageCompression from "browser-image-compression";
import { createClient } from "../client";
interface UploadImageProps {
	file: File;
	bucket: string;
	folder?: string;
}

export async function UploadImage({ file, bucket, folder }: UploadImageProps) {
	const fileName = file.name;
	const path = `${folder ? folder + "/" : ""}${fileName}`;

	try {
		file = await imageCompression(file, {
			maxSizeMB: 1,
		});
	} catch (error) {
		console.error(error);
		return { imageUrl: "", error: "Error compressing image" };
	}

	const supabase = createClient();
	const storage = supabase.storage;

	const { data, error } = await storage.from(bucket).upload(path, file);

	if (error) {
		console.error(error);
		return { imageUrl: "", error: "Error uploading image" };
	}
	const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL!}/storage/v1/object/public/${bucket}/${data?.path}`;

	return { imageUrl, error: "" };
}
