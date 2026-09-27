import { z } from "zod";
import { BasicFundraiserSchema } from "common";
import Link from "next/link";
import Image from "next/image";

export function GridView({
  fundraisers,
}: {
  fundraisers: z.infer<typeof BasicFundraiserSchema>[];
}) {
  if (fundraisers.length === 0) {
    return (
      <div className="w-full text-center py-12 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          No fundraisers available
        </h3>
        <p className="text-gray-500">
          Check back soon for upcoming fundraisers
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[50px]">
      {fundraisers.map((fundraiser) => (
        <Link
          key={fundraiser.id}
          href={`/buyer/fundraiser/${fundraiser.id}`}
          className="flex flex-col gap-[15px] w-full"
        >
          {/* Image */}
          <div className="bg-white h-[240px] rounded-md shadow-[2px_2px_5px_0px_rgba(140,140,140,0.25)] overflow-hidden relative">
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

          {/* Title and Organization */}
          <div className="flex flex-col gap-1 w-full">
            <h3 className="text-[20px] font-semibold leading-6 text-black">
              {fundraiser.name}
            </h3>
            <p className="text-base font-normal leading-6 text-[#545454]">
              {fundraiser.organization?.name || "Organization"}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
