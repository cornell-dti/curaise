import {
    CalendarIcon,
    MapPinIcon,
    Clock,
    ShoppingBag
  } from "lucide-react";
  import { Card, CardContent } from "@/components/ui/card";
  import { Badge } from "@/components/ui/badge";
  import Image from "next/image";
  import { z } from "zod";
  import { CompleteFundraiserSchema } from "common";
  import Link from "next/link";
  import { TbMoneybag } from "react-icons/tb";
  
  const isFundraiserActive = (startDate: Date, endDate: Date) => {
    const now = new Date();
    return now >= new Date(startDate) && now <= new Date(endDate);
  };
  const isFundraiserPast = (endDate: Date) => {
    const now = new Date();
    return now > new Date(endDate);
  };
  
  type Fundraiser = z.infer<typeof CompleteFundraiserSchema>;
  type FundraiserWithProfit = Fundraiser & {
    totalProfit: number;
  };
  type Fundraisers = FundraiserWithProfit[];
  
  interface FundraiserContentProps {
    fundraisersArray: Fundraisers;
  }
  
  export function SellerFundraiserCard({
    fundraisersArray,
  }: FundraiserContentProps) {

    return (
      <div className="pb-2">
        {fundraisersArray.length > 0 ? (
          <div className="space-y-8">
            {fundraisersArray.map((fundraiser: FundraiserWithProfit) => {
              const isActive = isFundraiserActive(
                fundraiser.buyingStartsAt,
                fundraiser.buyingEndsAt
              );
              const isPast = isFundraiserPast(fundraiser.buyingEndsAt);
              const fundraiserLink = `/buyer/fundraiser/${fundraiser.id}`;
              return (
              <Link href={fundraiserLink} key={fundraiser.id}>
                <Card
                  className="mb-4 overflow-hidden border shadow-sm"
                >
                  {fundraiser.imageUrls && fundraiser.imageUrls.length > 0 && (
                    <div className="relative w-full h-40 bg-muted">
                      <Image
                        src={fundraiser.imageUrls[0] || "/placeholder.svg"}
                        alt={fundraiser.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
  
                  <CardContent className="min-w-[60vw] p-5 flex flex-row justify-between">
                    <div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-semibold">{fundraiser.name}</h3>
                      {!isPast ? (
                        <Badge variant={isActive ? "default" : "secondary"}>
                          {isActive ? "Active" : "Upcoming"}{" "}
                        </Badge>
                      ) : (
                        <></>
                      )}
                    </div>
  
                    <div className="grid gap-4 sm:grid-cols-2 mb-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                        <CalendarIcon className="h-4 w-4 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm">
                            {fundraiser.pickupStartsAt.toLocaleDateString("en-US", { weekday: "long" })}{", "}{fundraiser.pickupStartsAt.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
  
                        <div className="flex items-start gap-2">
                          <MapPinIcon className="h-4 w-4 text-primary mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-muted-foreground">
                              PICKUP LOCATION
                            </p>
                            <p className="text-sm">{fundraiser.pickupLocation}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    </div>

                    <div className="border border-gray-300 rounded-lg px-5 flex flex-col min-height-7/10 items-center justify-evenly">
                      <h1 className="text-lg md:text-md font-semibold">Total Profit</h1>
                      <div className="flex items-center gap-1">
                        <p className="text-lg md:text-md">${fundraiser.totalProfit}</p>
                        <TbMoneybag className="h-6 w-6 text-primary" />
                        </div>
                    </div>

                  </CardContent>
                </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-medium">No active fundraisers</p>
            <p className="text-sm text-muted-foreground mt-1">
              There are currently no active fundraisers for this organization.
            </p>
          </div>
        )}
      </div>
    );
  }
  