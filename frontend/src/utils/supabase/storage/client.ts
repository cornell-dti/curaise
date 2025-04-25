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
	// Early return if path is empty or undefined
	if (!path) {
		return {
			success: false,
			error: "No path provided for image deletion",
		};
	}

	const supabase = createClient();

	// Remove any URL prefix to get just the path part after the bucket
	let cleanPath = path;

	// If the path contains the full URL, extract just the path portion
	if (path.includes("/storage/v1/object/public/")) {
		// Parse out the path after the bucket name
		try {
			const urlParts = path.split(`/${bucket}/`);
			if (urlParts.length > 1) {
				cleanPath = urlParts[1];
			}
		} catch (error) {
			console.error("Error parsing image path:", error);
			return {
				success: false,
				error: "Invalid image path format",
			};
		}
	}

	// Perform the deletion
	const { error } = await supabase.storage.from(bucket).remove([cleanPath]);

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
