import { createClient } from "@/utils/supabase/server";
import { CompleteFundraiserSchema } from "common";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  CalendarIcon,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import defaultImg from "@/components/ui/default_img.png";
import { Separator } from "@/components/ui/separator";

const getFundraiser = async (id: string, token: string) => {
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/fundraiser/" + id,
    {
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message);
  }

  // parse order data
  const data = CompleteFundraiserSchema.safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse order data");
  }
  return data.data;
};

export default async function FundraiserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: { image?: string };
}) {
  const supabase = await createClient();
  const id = (await params).id;

  const {
    data: { session },
    error: error2,
  } = await supabase.auth.getSession();
  if (error2 || !session?.access_token) {
    throw new Error("No session found");
  }

  const fundraiser = await getFundraiser(id, session.access_token);

  const daysRemaining = () => {
    const now = new Date();
    const end = fundraiser.buyingEndsAt;
    if (now > end) return 0;
    const diffTime = Math.abs(end.getTime() - now.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  // const totalImages = fundraiser.imageUrls.length;
  // const currentImageIndex = searchParams?.image
  //   ? Number(searchParams.image)
  //   : 0;
  // const safeIndex = Math.max(0, Math.min(currentImageIndex, totalImages - 1));

  return (
    <div className="flex min-h-screen flex-col justify-center">
      <main className="flex-1 justify-center">
        <section className="w-full">
          {/* <div className="relative aspect-[4/3] md:aspect-[16/9] w-full ==">
            <div className="relative aspect-[4/3] md:aspect-[16/9] w-full">
              <Image
                src={fundraiser.imageUrls[safeIndex] || "/placeholder.svg"}
                alt={`${fundraiser.name} image ${safeIndex + 1}`}
                fill
                className="w-3/4"
                priority
              /> */}

          {/* Image Navigation */}
          {/* {totalImages > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  {fundraiser.imageUrls.map((_, index) => (
                    <Link
                      key={index}
                      href={`?image=${index}`}
                      className={`h-2 w-2 rounded-full ${
                        index === safeIndex ? "bg-primary" : "bg-background/60"
                      }`}
                      aria-label={`View image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div> */}

          <div className="relative aspect-[8/5] lg:aspect-[3/1] w-full ==">
            <div className="relative aspect-[8/5] lg:aspect-[3/1] w-full">
              <Image
                src={defaultImg}
                alt="default image"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
          <div className="container px-5 py-6 md:py-8">
            <div className="space-y-4">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
                {fundraiser.name}
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                {fundraiser.description}
              </p>

              <div className="flex items-center text-sm text-foreground">
                <CalendarIcon className="mr-1 h-4 w-4" />
                <span>
                  {fundraiser.pickupStartsAt.toLocaleDateString("en-US", {
                    weekday: "long",
                  })}
                  {", "}
                  {fundraiser.pickupStartsAt.toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center text-sm text-foreground">
                <MapPin className="mr-1 h-4 w-4" />
                <span>
                  {fundraiser.pickupLocation}
                  {", "}
                  {fundraiser.pickupStartsAt.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" to "}
                  {fundraiser.pickupEndsAt.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
          <Separator className="max-w-[87.5%] mx-auto" />

          <div className="space-y-4 px-5 py-6 md:py-8">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
              Items
            </h1>
          </div>
        </section>
      </main>
    </div>
  );
}
