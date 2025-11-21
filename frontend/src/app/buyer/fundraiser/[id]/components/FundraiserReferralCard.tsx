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
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

export function FundraiserReferralCard({
  fundraiser,
  id,
  token,
}: {
  fundraiser: z.infer<typeof CompleteFundraiserSchema>;
  id: string;
  token: string;
}) {
  const [referralOpen, setReferralOpen] = useState(false);

  const addReferrer = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${id}/referrals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({}),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Failed to add referrer");
        return;
      }

      toast.success("Referrer added!");
      setReferralOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong adding the referrer");
    }
  };

  return (
    <div>
      <Card className="w-full">
        <CardContent className="py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex gap-2 justify-center">
              <Star />
              <span className="text-md font-semibold">
                [{fundraiser.organization.name} Members Only] Become a Referrer
              </span>
            </span>
            <Button
              className="font-light"
              onClick={async () => {
                await addReferrer();
                setReferralOpen(true);
              }}
            >
              Sign Up
            </Button>
          </div>
        </CardContent>
      </Card>
      <ReferralModal open={referralOpen} setOpen={setReferralOpen} />
    </div>
  );
}

function ReferralModal({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [link, setLink] = useState(
    "https://www.curaise.com/DTI/Cheese-cake-bake-sale/83hw2ss85729cbskwh3"
  );
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="md:max-w-[800px] sm:max-w-[600px]">
        <DialogHeader className="pt-2 pb-[30px]">
          <DialogTitle className="text-2xl font-semibold">
            Thanks for signing up!
          </DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-4">
          <span className="text-md font-medium text-muted-foreground">
            <AlarmClock className="w-5 text-black" />
          </span>
          <span>
            We will manually review your request, which may take a little
            time.{" "}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-md font-medium text-muted-foreground">
            <Share2 className="w-5 text-black" />
          </span>
          <span>
            While you wait, you can still share your referral link with others
            to be automatically referred.{" "}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 -ml-3 md:ml-0">
          <span className="p-1 pl-2 flex-1 flex flex-row gap-2 items-center border border-muted-foreground rounded-sm text-xs md:text-sm">
            <Link className="min-w-5" />
            {link}
          </span>
          <Button
            className="cursor-pointer font-light text-xs md:text-md"
            onClick={async () => {
              await copyToClipboard();
            }}
          >
            Copy Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
