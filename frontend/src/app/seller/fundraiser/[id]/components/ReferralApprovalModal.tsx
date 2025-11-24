"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CompleteFundraiserSchema, ReferralSchema } from "common";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const approveReferrer = async (
  fundraiserId: string,
  referralId: string,
  token: string
) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${fundraiserId}/referrals/${referralId}/approve`,
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
      toast.error(result.error || "Failed to approve referrer");
      return;
    }

    toast.success("Referrer approved!");
  } catch (err) {
    console.error(err);
    toast.error("Something went wrong approving the referrer");
  }
};

const deleteReferrer = async (
  fundraiserId: string,
  referralId: string,
  token: string
) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${fundraiserId}/referrals/${referralId}/delete`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({}),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      toast.error(result.error || "Failed to delete referrer");
      return;
    }

    toast.success("Referrer deleted!");
  } catch (err) {
    console.error(err);
    toast.error("Something went wrong deleting the referrer");
  }
};

export function ReferralApprovalModal({
  fundraiser,
  token,
  open,
  setOpen,
  onAction,
}: {
  fundraiser: z.infer<typeof CompleteFundraiserSchema>;
  token: string;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onAction: (total: number) => void;
}) {
  const [notApprovedReferrers, setNotApprovedReferrers] = useState<
    z.infer<typeof ReferralSchema>[]
  >(fundraiser.referrals.filter((ref) => !ref.approved));

  useEffect(() => {
    onAction(notApprovedReferrers.length);
  }, [notApprovedReferrers.length, onAction]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex flex-col max-h-[80vh] md:max-w-[600px] sm:max-w-[500px]">
        <DialogHeader className="pt-2 pb-[30px]">
          <DialogTitle className="text-2xl font-semibold">
            Referrer Sign Up
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto -mr-2">
          {notApprovedReferrers.map((referral, idx) => {
            return (
              <div key={referral.id}>
                <div className="flex justify-between">
                  <span>{referral.referrer.name}</span>
                  <span className="flex gap-2 items-center">
                    <Button
                      onClick={async () => {
                        await approveReferrer(
                          fundraiser.id,
                          referral.id,
                          token
                        );
                        setNotApprovedReferrers((prev) =>
                          prev.filter((ref) => ref.id !== referral.id)
                        );
                        onAction(notApprovedReferrers.length);
                      }}
                      className="text-[#265B34] border border-current bg-transparent hover:bg-[#e6f0ea]"
                    >
                      Approve
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={async () => {
                        await deleteReferrer(fundraiser.id, referral.id, token);
                        setNotApprovedReferrers((prev) =>
                          prev.filter((ref) => ref.id !== referral.id)
                        );
                      }}
                      className="text-[#f74545] bg-transparent hover:bg-[#fdeaea] hover:text-[#f74545]"
                    >
                      Deny
                    </Button>
                  </span>
                </div>
                {idx < fundraiser.referrals.length - 1 && (
                  <div className="flex justify-center">
                    <Separator className="my-3 w-[90%]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
