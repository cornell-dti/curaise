import { z } from "zod";
import { BasicFundraiserSchema } from "common";
import Link from "next/link";
import Image from "next/image";

interface BrowseFundraiserCardProps {
  fundraiser: z.infer<typeof BasicFundraiserSchema>;
}

export function BrowseFundraiserCard({ fundraiser }: BrowseFundraiserCardProps) {
  return (
    <Link
      href={`/buyer/fundraiser/${fundraiser.id}`}
      className="flex flex-col gap-[15px] w-full"
    >
      <div className="bg-white aspect-[3/2] w-full rounded-md shadow-[2px_2px_5px_0px_rgba(140,140,140,0.25)] overflow-hidden relative">
        {fundraiser.imageUrls && fundraiser.imageUrls.length > 0 ? (
          <Image
            src={fundraiser.imageUrls[0]}
            alt={fundraiser.name}
            fill
            className="object-cover"
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-400">No image</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 w-full">
        <h3 className="text-[20px] font-semibold leading-6 text-black">
          {fundraiser.name}
        </h3>
        <p className="text-base font-normal leading-6 text-[#545454]">
          {fundraiser.organization?.name || "Organization"}
        </p>
      </div>
    </Link>
  );
}
