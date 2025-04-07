"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnnouncementSchema } from "common";
import { z } from "zod";

interface FundraiserAnnouncementPanelProps {
    announcements: z.infer<typeof AnnouncementSchema>[];
}

export function FundraiserAnnouncementPanel({
	announcements = [],
}: FundraiserAnnouncementPanelProps) {
	const [isOpen, setIsOpen] = useState(false);

	const toggleDropdown = () => {
		setIsOpen(!isOpen);
	};

	if (announcements.length === 0) {
		return null;
	}

	return (
		<div className="border-b">
			<div className="p-6 md:p-10">
				<button
					onClick={toggleDropdown}
					className="w-full flex items-center justify-between bg-white rounded-md p-4 border hover:bg-gray-50 transition-colors">
					<div className="flex items-center">
						<Bell className="w-5 h-5 mr-2 text-gray-600" />
						<h2 className="text-lg font-semibold">
							Announcements ({announcements.length})
						</h2>
					</div>
					{isOpen ? (
						<ChevronUp className="w-5 h-5 text-gray-600" />
					) : (
						<ChevronDown className="w-5 h-5 text-gray-600" />
					)}
				</button>

				<div
					className={cn(
						"mt-2 overflow-hidden transition-all duration-300 ease-in-out",
						isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
					)}>
					<div className="space-y-4 pt-2">
						{announcements.map((announcement) => (
							<div
								key={announcement.id}
								className="bg-white p-4 rounded-md border">
								<div className="flex justify-between items-start mb-2">
									<h3 className="font-medium text-gray-900">Announcement</h3>
									<span className="text-xs text-gray-500">
										{new Date(announcement.createdAt).toLocaleDateString()}
									</span>
								</div>
								<p className="text-gray-600 text-sm">{announcement.message}</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
