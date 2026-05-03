import { BasicFundraiserSchema, CompleteItemSchema } from "common";
import { z } from "zod";
import moment from "moment";
import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

export function FundraiserSideCard({
  fundraiser,
  items,
  bgColor,
  borderColor,
}: {
  fundraiser: z.infer<typeof BasicFundraiserSchema>;
  items: z.infer<typeof CompleteItemSchema>[];
  bgColor: string;
  borderColor: string;
}) {
  const router = useRouter();
  const data = {
    title: fundraiser.name,
    hostedBy: fundraiser.organization.name,
    description: fundraiser.description,
    pickupLocations: fundraiser.pickupEvents.map((event) => (
      <span className="flex flex-col">
        {event.location}
        <span>
          {moment(event.startsAt).format("h:mm A")} -
          {moment(event.endsAt).format("h:mm A")}
        </span>
      </span>
    )),
    items: items.map((item) => ({
      name: item.name,
      price: `$${Number(item.price).toFixed(2)}`,
      image: item.imageUrl ?? undefined,
    })),
  };

  return (
    <div
      className="rounded-[10px] bg-white content-stretch flex flex-col items-start relative md:w-[160px] overflow-auto"
      data-name="Side Bar"
    >
      <div
        className="relative rounded-[10.328px] shrink-0 w-full"
        style={{ backgroundColor: bgColor }}
      >
        <div
          aria-hidden="true"
          className="absolute border-2 border-solid inset-0 pointer-events-none rounded-[10.328px]"
          style={{ borderColor }}
        />
        <div className="content-stretch flex flex-col items-start p-[10.328px] relative size-full">
          <div className="content-stretch flex flex-col gap-[8px] items-start relative w-full">
            {/* Content */}
            <div className="content-stretch flex flex-col gap-[8px] items-center justify-center relative shrink-0">
              {/* Title with icon */}
              <div className="content-stretch flex gap-[5px] items-start relative w-full">
                <div
                  className="flex w-full min-w-0 flex-col justify-center font-bold leading-[0] text-sm"
                  style={{ fontVariationSettings: "'opsz' 14" }}
                >
                  <p className="text-white break-words whitespace-normal leading-[normal]">
                    {data.title}
                  </p>
                </div>
              </div>

              {/* Hosted by */}
              <div className="content-stretch relative flex w-full flex-col items-start">
                <div
                  className="flex w-full min-w-0 flex-col justify-center font-bold leading-[0] text-xs"
                  style={{ fontVariationSettings: "'opsz' 14" }}
                >
                  <p className="break-words whitespace-normal leading-[normal]">
                    <span className="text-white leading-[normal]">{`Hosted by: `}</span>
                    <span
                      className="text-white break-words whitespace-normal decoration-solid font-light leading-[normal] underline"
                      style={{ fontVariationSettings: "'opsz' 14" }}
                    >
                      {data.hostedBy}
                    </span>
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="content-stretch relative flex w-full flex-col items-start gap-[4px] leading-[0] text-xs">
                <div className="flex w-full min-w-0 flex-col justify-center font-bold">
                  <p className="text-white leading-[normal]">Description</p>
                </div>
                <div className="relative w-full min-w-0 font-normal">
                  <p className="text-white break-words whitespace-normal leading-[normal]">
                    {data.description}
                  </p>
                </div>
              </div>

              {/* Pickup Details */}
              <div className="content-stretch relative flex w-full flex-col items-start gap-[5.164px]">
                <div
                  className="flex w-full min-w-0 flex-col justify-center font-bold leading-[0] text-xs"
                  style={{ fontVariationSettings: "'opsz' 14" }}
                >
                  <p className="text-white leading-[normal]">Pickup Details</p>
                </div>
                {data.pickupLocations.map((location, index) => (
                  <div
                    key={index}
                    className="content-stretch relative flex w-full items-start gap-[2.582px]"
                  >
                    <MapPin className="text-white h-4 w-4 shrink-0" />
                    <div
                      className="relative flex min-w-0 flex-1 flex-col justify-center font-normal leading-[0] text-xs"
                      style={{ fontVariationSettings: "'opsz' 14" }}
                    >
                      <p className="text-white break-words whitespace-normal leading-[normal]">
                        {location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Items */}
              <div className="w-full content-stretch flex flex-col gap-[4px] md:h-[250px] overflow-auto items-start relative shrink-0">
                <div
                  className="flex flex-col font-bold justify-center leading-[normal] relative shrink-0 text-xs w-[126px]"
                  style={{ fontVariationSettings: "'opsz' 14" }}
                >
                  <p className="text-white leading-[normal]">Items</p>
                </div>
                <div className="flex flex-wrap md:flex-col gap-4">
                  {data.items.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white content-stretch flex flex-col gap-[3.161px] items-center justify-center relative rounded-[2.371px] shrink-0 w-[139.489px]"
                    >
                      <div
                        aria-hidden="true"
                        className="absolute border-[#f6f6f6] border-[0.395px] border-solid inset-0 pointer-events-none rounded-[2.371px] shadow-[0.79px_0.79px_2.015px_0px_rgba(140,140,140,0.25)]"
                      />
                      {/* Image */}
                      <div className="h-[81px] relative rounded-md shrink-0 w-full">
                        {item.image ? (
                          <img
                            alt={item.name}
                            className="absolute rounded-md inset-0 max-w-none object-cover pointer-events-none rounded-tl-[2.371px] rounded-tr-[2.371px] size-full"
                            src={item.image}
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gray-200" />
                        )}
                      </div>
                      {/* Name and Price */}
                      <div className="relative shrink-0 w-full">
                        <div className="flex flex-row items-end size-full">
                          <div className="content-stretch flex items-end px-[6.322px] relative size-full">
                            <div className="pb-1 content-stretch flex items-start justify-between leading-[normal] relative shrink-0 w-[127px]">
                              <p
                                className="relative min-w-0 flex-1 break-words whitespace-normal pr-2 text-[9px] font-semibold text-[#1e1c1c]"
                                style={{ fontVariationSettings: "'opsz' 14" }}
                              >
                                {item.name}
                              </p>
                              <p
                                className="font-normal relative shrink-0 text-[#989898] text-[9px] whitespace-nowrap"
                                style={{ fontVariationSettings: "'opsz' 14" }}
                              >
                                {item.price}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}{" "}
                </div>
              </div>
            </div>

            {/* View Fundraiser Button */}
            <div
              onClick={() => router.push(`/buyer/fundraiser/${fundraiser.id}`)}
              className="text-white flex h-[26px] items-center justify-center px-[16px] py-[8px] mt-2 md:mt-0 rounded-[6px] w-full cursor-pointer"
              style={{
                backgroundColor: borderColor,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${borderColor} 70%, black)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = borderColor;
              }}
            >
              <span className="font-semibold text-[12px] leading-[18px]">
                View Fundraiser
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
