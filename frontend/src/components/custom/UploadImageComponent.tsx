"use client";
import { Button } from "@/components/ui/button";
import { ChangeEvent, useRef, useState, useTransition } from "react";
import { convertBlobUrlToFile } from "@/lib/urlToFile";
import Image from "next/image";
import { UploadImage } from "@/utils/supabase/storage/client";
import { createClient } from "@/utils/supabase/client";

interface UploadImageComponentProps {
	folder?: string;
	tableName: string;
	recordId: string;
	columnName: string;
}
function UploadImageComponent({folder, tableName, recordId, columnName}: UploadImageComponentProps) {
	const imageInputRef = useRef<HTMLInputElement>(null);
	const [imageUrls, setImageUrls] = useState<string[]>([]);
	console.log(imageUrls);
	const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			const filesArray = Array.from(e.target.files);
			const newImageUrls = filesArray.map((file) => URL.createObjectURL(file));
			setImageUrls([...imageUrls, ...newImageUrls]);
		}
	};
	const [isPending, startTransition] = useTransition();
	const handleClickUploadImages = () => {
		startTransition(async () => {
			let urls = [];
			for (const url of imageUrls) {
				const imageFile = await convertBlobUrlToFile(url);

				const { imageUrl, error } = await UploadImage({
                    file: imageFile,
					bucket: "images",
					folder: folder,
				});

				if (error) {
					console.error(error);
					return;
				}

				urls.push(imageUrl);
			}

			// Update table with array of image URLs
			if (tableName && recordId && urls.length > 0) {
				const  supabase  = createClient();
				const { error } = await supabase.from(tableName).update({ [columnName]: JSON.stringify(urls) }).eq("id", recordId);

				if (error) {
					console.error(error);
					return;
				}
			}
			console.log(urls);
			setImageUrls(urls);
		});
	};
	return (
		<div>
			<input
				type="file"
				hidden
				multiple
				ref={imageInputRef}
				onChange={handleImageChange}
				disabled={isPending}
			/>
			<Button onClick={() => imageInputRef.current?.click()}>
				Select Images
			</Button>
			<div className="flex gap-4">
				{imageUrls.map((url, index) => (
					<Image
						key={url}
						src={url}
						width={100}
						height={100}
						alt={`image ${index}`}
					/>
				))}
			</div>
			<Button onClick={handleClickUploadImages} disabled={isPending}>
				{isPending ? "Uploading ..." : "Upload Images"}
			</Button>
		</div>
	);
}

export default UploadImageComponent;
