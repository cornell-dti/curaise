"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, Bell, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnnouncementSchema } from "common";
import type { z } from "zod";
import { format } from "date-fns";

export function FundraiserAnnouncementPanel({
  announcements,
}: {
  announcements: z.infer<typeof AnnouncementSchema>[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  if (announcements.length === 0) {
    return null;
  }

  return (
    <div className="px-10">
      <button
        onClick={toggleDropdown}
        className="w-full flex items-start bg-white rounded-lg p-4 border hover:bg-gray-50 transition-colors"
      >
        <Megaphone className="w-5 h-5 mr-3 mt-0.5 text-gray-600 flex-shrink-0" />
        <div className="flex-1 overflow-hidden text-left">
          <h2 className="text-lg font-semibold leading-tight">
            Announcements ({announcements.length})
          </h2>
        </div>
        <div className="flex-shrink-0 ml-2 self-center">
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </div>
      </button>

      {/* Dropdown Content */}
      {announcements.length > 1 && (
        <div
          className={cn(
            "mt-2 overflow-hidden transition-all duration-300 ease-in-out",
            isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="space-y-4 pt-2">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-white p-4 rounded-md border"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-900">Announcement</h3>
                  <span className="text-xs text-gray-500">
                    {format(announcement.createdAt, "MMM d, yyyy 'at' h:mm a")}
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
