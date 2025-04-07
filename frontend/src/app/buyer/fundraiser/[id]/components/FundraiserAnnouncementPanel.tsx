"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnnouncementSchema } from "common";
import type { z } from "zod";

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

	const mostRecent = announcements[0];

	const truncateMessage = (message: string, maxLength = 60) => {
		return message.length > maxLength
			? `${message.substring(0, maxLength)}...`
			: message;
	};

	return (
		<div className="px-10">
			<button
				onClick={toggleDropdown}
				disabled={announcements.length <= 1}
				className="w-full flex items-start bg-white rounded-md p-4 border hover:bg-gray-50 transition-colors">
				<Bell className="w-5 h-5 mr-3 mt-0.5 text-gray-600 flex-shrink-0" />
				<div className="flex-1 overflow-hidden text-left">
					<h2 className="text-lg font-semibold leading-tight">
						Announcements ({announcements.length})
					</h2>
					<p className="text-sm text-gray-600 truncate mt-1">
						{truncateMessage(mostRecent.message)}
					</p>
				</div>
				{announcements.length > 1 && (
					<div className="flex-shrink-0 ml-2 self-center">
						{isOpen ? (
							<ChevronUp className="w-5 h-5 text-gray-600" />
						) : (
							<ChevronDown className="w-5 h-5 text-gray-600" />
						)}
					</div>
				)}
			</button>
			{/* Dropdown Content */}
			{announcements.length > 1 && (
				<div
					className={cn(
						"mt-2 overflow-hidden transition-all duration-300 ease-in-out",
						isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
					)}>
					<div className="space-y-4 pt-2">
						{/* Map over announcements starting from the second element */}
						{announcements.slice(1).map((announcement) => (
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
			)}
		</div>
	);
}
