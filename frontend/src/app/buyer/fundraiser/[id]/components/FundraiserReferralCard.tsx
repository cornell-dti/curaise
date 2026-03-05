"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CompleteFundraiserSchema } from "common";
import { Star, AlarmClock, Share2, Link } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { usePathname } from "next/navigation";
import { mutationFetch } from "@/lib/fetcher";
import { InfoTooltip } from "@/components/custom/MoreInfoToolTip";

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard!");
};

export function FundraiserReferralCard({
  fundraiser,
  token,
  userId,
}: {
  fundraiser: z.infer<typeof CompleteFundraiserSchema>;
  token: string;
  userId: string;
}) {
  const pathname = usePathname();
  const [referralOpen, setReferralOpen] = useState(false);
  const [referralId, setReferralId] = useState<string>(
    fundraiser.referrals.find((r) => r.referrer.id === userId)?.id || "",
  );
  const link = `${window.location.origin}${pathname}?code=${referralId}`;

  const addReferrer = async () => {
    try {
      const result = await mutationFetch(
        `/fundraiser/${fundraiser.id}/referrals`,
        {
          token,
        },
      );

      toast.success("Referrer added!");
      setReferralOpen(true);
      setReferralId((result.data as { id: string }).id);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Something went wrong when adding the referrer",
      );
    }
  };

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardContent className="py-3">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <span className="flex gap-2 items-start">
              <Star />
              <span className="text-md font-semibold">
                <span className="flex items-center ">
                  [{fundraiser.organization.name} Members Only] Become a
                  Referrer{" "}
                  <InfoTooltip content="Once you sign up and get verified as a referrer, other users can add you as a referrer in their orders. You can also send other users a custom referral link that will automatically add you as a referrer for that order. " />
                </span>
              </span>
            </span>
            {!referralId ? (
              <Button
                className="font-light mt-1 lg:mt-0 w-full lg:w-auto"
                onClick={async () => {
                  await addReferrer();
                }}
              >
                Sign Up
              </Button>
            ) : (
              <Button
                className="cursor-pointer font-light text-sm lg:text-md lg:mt-0 w-full lg:w-auto"
                onClick={() => copyToClipboard(link)}
              >
                Copy Referral Link
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      <ReferralModal
        link={link}
        open={referralOpen}
        setOpen={setReferralOpen}
      />
    </div>
  );
}

function ReferralModal({
  link,
  open,
  setOpen,
}: {
  link: string;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="md:max-w-[800px] sm:max-w-[600px]">
        <DialogHeader className="pt-2">
          <DialogTitle className="text-2xl font-semibold">
            Thanks for signing up!
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-4">
          <span className="text-md font-medium text-muted-foreground">
            <AlarmClock className="w-5 text-black" />
          </span>
          <span>
            We will manually review your request, which may take a little time.
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-md font-medium text-muted-foreground">
            <Share2 className="w-5 text-black" />
          </span>
          <span>
            While you wait, you can still share your referral link with others
            to be automatically referred.
          </span>
        </div>
        <div className="pb-3 flex items-center justify-between gap-2">
          <span className="p-1 pl-2 flex-1 flex flex-row gap-2 items-center border border-muted-foreground rounded-sm text-xs md:text-sm">
            <Link className="max-w-5 min-w-5" />
            fundraiser/{link.match(/code=([^&]+)/)?.[1]}
          </span>
          <Button
            className="cursor-pointer font-light text-xs md:text-md"
            onClick={() => copyToClipboard(link)}
          >
            Copy Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
