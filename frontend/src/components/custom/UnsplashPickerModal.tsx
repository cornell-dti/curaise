"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Search } from "lucide-react";

interface UnsplashPhoto {
	id: string;
	urls: {
		small: string;
		regular: string;
	};
	links: {
		download_location: string;
	};
	user: {
		name: string;
		links: {
			html: string;
		};
	};
}

interface UnsplashPickerModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSelectPhotos: (urls: string[]) => void;
	allowMultiple?: boolean;
}

export function UnsplashPickerModal({
	open,
	onOpenChange,
	onSelectPhotos,
	allowMultiple = true,
}: UnsplashPickerModalProps) {
	const [query, setQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(
		new Set()
	);

	// Debounce query by 500ms
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQuery(query);
			setPage(1);
		}, 500);
		return () => clearTimeout(timer);
	}, [query]);

	// Fetch photos when debouncedQuery or page changes
	const fetchPhotos = useCallback(async () => {
		if (!debouncedQuery.trim()) {
			setPhotos([]);
			setTotalPages(0);
			return;
		}

		const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
		if (!accessKey) {
			setError("Unsplash API key not configured.");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const res = await fetch(
				`https://api.unsplash.com/search/photos?query=${encodeURIComponent(debouncedQuery)}&per_page=12&page=${page}&client_id=${accessKey}`
			);
			if (!res.ok) {
				throw new Error(`Unsplash API error: ${res.status}`);
			}
			const data = await res.json();
			setPhotos(data.results ?? []);
			setTotalPages(data.total_pages ?? 0);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to fetch photos."
			);
		} finally {
			setIsLoading(false);
		}
	}, [debouncedQuery, page]);

	useEffect(() => {
		fetchPhotos();
	}, [fetchPhotos]);

	// Reset state when modal closes
	useEffect(() => {
		if (!open) {
			setQuery("");
			setDebouncedQuery("");
			setPhotos([]);
			setPage(1);
			setTotalPages(0);
			setIsLoading(false);
			setError(null);
			setSelectedPhotoIds(new Set());
		}
	}, [open]);

	function togglePhoto(id: string) {
		setSelectedPhotoIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				if (!allowMultiple) {
					next.clear();
				}
				next.add(id);
			}
			return next;
		});
	}

	async function handleConfirm() {
		const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
		const selected = photos.filter((p) => selectedPhotoIds.has(p.id));

		// Trigger download endpoint for each selected photo (Unsplash API requirement)
		await Promise.allSettled(
			selected.map((photo) =>
				fetch(
					`${photo.links.download_location}&client_id=${accessKey}`
				).catch(() => {
					// Silently ignore download tracking errors
				})
			)
		);

		const urls = selected.map((p) => p.urls.regular);
		onSelectPhotos(urls);
		onOpenChange(false);
	}

	const selectedCount = selectedPhotoIds.size;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
				<DialogHeader className="px-6 pt-6 pb-4 border-b">
					<DialogTitle>Search Unsplash Photos</DialogTitle>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
					{/* Search input */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Search photos..."
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className="pl-9"
						/>
					</div>

					{/* Photo grid */}
					{isLoading ? (
						<div className="grid grid-cols-3 gap-3">
							{Array.from({ length: 12 }).map((_, i) => (
								<div
									key={i}
									className="aspect-video bg-gray-200 rounded-md animate-pulse"
								/>
							))}
						</div>
					) : error ? (
						<p className="text-sm text-red-500 text-center py-8">{error}</p>
					) : !debouncedQuery.trim() ? (
						<p className="text-sm text-gray-500 text-center py-8">
							Search for photos above.
						</p>
					) : photos.length === 0 ? (
						<p className="text-sm text-gray-500 text-center py-8">
							No photos found for &ldquo;{debouncedQuery}&rdquo;.
						</p>
					) : (
						<div className="grid grid-cols-3 gap-3">
							{photos.map((photo) => {
								const isSelected = selectedPhotoIds.has(photo.id);
								return (
									<button
										key={photo.id}
										type="button"
										onClick={() => togglePhoto(photo.id)}
										className={`relative aspect-video rounded-md overflow-hidden group focus:outline-none ${
											isSelected
												? "ring-2 ring-primary ring-offset-2"
												: "ring-0"
										}`}>
										<Image
											src={photo.urls.small}
											alt={`Photo by ${photo.user.name}`}
											fill
											sizes="(max-width: 768px) 33vw, 220px"
											className="object-cover"
										/>
										{/* Photographer attribution overlay */}
										<a
											href={`${photo.user.links.html}?utm_source=curaise&utm_medium=referral`}
											target="_blank"
											rel="noopener noreferrer"
											onClick={(e) => e.stopPropagation()}
											className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity truncate">
											{photo.user.name}
										</a>
										{/* Selected checkmark */}
										{isSelected && (
											<div className="absolute top-1.5 right-1.5 bg-primary text-white rounded-full p-0.5">
												<Check className="h-3 w-3" />
											</div>
										)}
									</button>
								);
							})}
						</div>
					)}

					{/* Pagination */}
					{totalPages > 1 && !isLoading && (
						<div className="flex items-center justify-center gap-3">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}>
								Previous
							</Button>
							<span className="text-sm text-gray-500">
								{page} / {totalPages}
							</span>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
								disabled={page === totalPages}>
								Next
							</Button>
						</div>
					)}
				</div>

				<DialogFooter className="px-6 py-4 border-t flex flex-row items-center justify-between">
					<p className="text-xs text-gray-500">
						Photos provided by{" "}
						<a
							href="https://unsplash.com/?utm_source=curaise&utm_medium=referral"
							target="_blank"
							rel="noopener noreferrer"
							className="underline hover:text-gray-700">
							Unsplash
						</a>
					</p>
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}>
							Cancel
						</Button>
						<Button
							type="button"
							disabled={selectedCount === 0}
							onClick={handleConfirm}>
							{selectedCount === 0
								? "Add Photos"
								: `Add ${selectedCount} Photo${selectedCount !== 1 ? "s" : ""}`}
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
