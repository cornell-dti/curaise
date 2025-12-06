"use client";

import {
	type ChangeEvent,
	useRef,
	useState,
	useTransition,
	type DragEvent,
} from "react";
import Image from "next/image";
import { uploadImage, deleteImage } from "@/utils/supabase/storage/client";
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
	const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
	const [isPending, startTransition] = useTransition();

	const processFiles = async (files: File[]) => {
		if (imageInputRef.current) {
			imageInputRef.current.value = "";
		}

		// Check if files are empty
		if (!files.length) return;

		// Filter for only IMAGE files
		const imageFiles = files.filter((file) => file.type.startsWith("image/"));
		if (imageFiles.length === 0) return;

		// For single image upload, only use the first image
		const filesToProcess = allowMultiple ? imageFiles : [imageFiles[0]];

		startTransition(async () => {
			const urls: string[] = [];

			for (const file of filesToProcess) {
				try {
					// If image has spaces in the name, replace them with underscores
					// This is to avoid issues with file names when uploading
					// regex \s+ matches one or more whitespace characters
					// g is for global search (replace all occurrences of the pattern)
					const filename = file.name.replace(/\s+/g, "_");

					// Generate a unique filename
					const uniqueFilename = `${Date.now()}_${filename}`;

					const uniqueFile = new File([file], uniqueFilename, {
						type: file.type,
					});

					const { imageUrl, error } = await uploadImage({
						file: uniqueFile,
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
				// Set the image URLs in the parent component (this is for the form field values)
				if (allowMultiple) {
					setImageUrls([...imageUrls, ...urls]);
				} else {
					// For single item image
					setImageUrls([urls[0]]);
				}
			}
		});
	};

	// Handle file selection from the file input
	// If user selects no files, do nothing
	// If user selects files, convert files to an array and process them
	const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files?.length) return;
		const filesArray = Array.from(e.target.files);
		await processFiles(filesArray);
	};

	const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();

		// Check if files are dropped in
		// If files are dropped, convert files to an array and process them
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			const filesArray = Array.from(e.dataTransfer.files);
			await processFiles(filesArray);
		}
	};

	const removeUploadedImage = async (indexToRemove: number) => {
		// Get the URL that's being removed
		let removedUrl = uploadedUrls[indexToRemove];
		const folderPos = removedUrl.indexOf(`${folder}/`);
		if (folderPos !== -1) {
			// Return everything from "fundraisers/" to the end of the string
			removedUrl = removedUrl.substring(folderPos);
		}

		// Update local state first (update the preview image urls by filtering out the removed image)
		const newUrls = uploadedUrls.filter((_, index) => index !== indexToRemove);
		setUploadedUrls(newUrls);

		// Or to delete an image using its full URL
		const _ = await deleteImage({
			bucket: "images",
			path: removedUrl,
		});

		// Then update parent component states (update form field values)
		setImageUrls(imageUrls.filter((url) => url !== removedUrl));

		// When an image is uploaded, the value of imageInputRef is set to the image path
		// When we remove an image from the input, the value of the ref does not get reset thus
		// the onChange event of input component does not get triggered.
		// To allow the user to upload the same image again, we need to reset the value of the input
		if (imageInputRef.current) {
			imageInputRef.current.value = "";
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
				className={`border-2 border-dashed rounded-lg p-6 transition-colors`}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				onClick={() => imageInputRef.current?.click()}>
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
							className="relative aspect-video bg-gray-50 rounded-md border overflow-hidden group min-h-[150px]">
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
								aria-label="Remove image">
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
