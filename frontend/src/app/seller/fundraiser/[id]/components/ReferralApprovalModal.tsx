"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  CompleteFundraiserSchema,
  CompleteOrderSchema,
  ReferralSchema,
} from "common";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { mutationFetch } from "@/lib/fetcher";

const approveReferrer = async (
  fundraiserId: string,
  referralId: string,
  token: string,
) => {
  try {
    await mutationFetch(
      `/fundraiser/${fundraiserId}/referrals/${referralId}/approve`,
      { token },
    );
    toast.success("Referrer approved!");
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : "Failed to approve referrer",
    );
  }
};

const deleteReferrer = async (
  fundraiserId: string,
  referralId: string,
  token: string,
) => {
  try {
    await mutationFetch(
      `/fundraiser/${fundraiserId}/referrals/${referralId}/delete`,
      { method: "DELETE", token },
    );
    toast.success("Referrer deleted!");
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : "Failed to delete referrer",
    );
  }
};

export function ReferralApprovalModal({
  fundraiser,
  token,
  referrals,
  open,
  setOpen,
}: {
  fundraiser: z.infer<typeof CompleteFundraiserSchema>;
  token: string;
  referrals: z.infer<typeof ReferralSchema>[];
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [unapprovedReferrers, setUnapprovedReferrers] = useState<
    z.infer<typeof ReferralSchema>[]
  >(referrals.filter((ref) => !ref.approved));

  useEffect(() => {
    setUnapprovedReferrers(referrals.filter((ref) => !ref.approved));
  }, [referrals]);
  
  const [loadingId, setLoadingId] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex flex-col max-h-[80vh] md:max-w-[600px] sm:max-w-[500px]">
        <DialogHeader className="pt-2">
          <DialogTitle className="text-2xl font-semibold">
            Referrer Sign Up
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto -mr-2">
          {unapprovedReferrers.length === 0 ? (
            <div>
              There are currently no referrer sign ups. You can manually approve
              them once they appear.
            </div>
          ) : (
            <>
              {unapprovedReferrers.map((referral, idx) => {
                return (
                  <div key={referral.id}>
                    <div className="flex justify-between">
                      <span>{referral.referrer.name}</span>
                      <span className="flex gap-2 items-center">
                        <Button
                          disabled={loadingId === referral.id}
                          onClick={async () => {
                            if (loadingId) return;
                            setLoadingId(referral.id);
                            await approveReferrer(
                              fundraiser.id,
                              referral.id,
                              token,
                            );
                            setUnapprovedReferrers((prev) =>
                              prev.filter((ref) => ref.id !== referral.id),
                            );
                            setLoadingId(null);
                          }}
                          className="text-[#265B34] border border-current bg-transparent hover:bg-[#e6f0ea]"
                        >
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={loadingId === referral.id}
                          onClick={async () => {
                            if (loadingId) return;
                            setLoadingId(referral.id);
                            await deleteReferrer(
                              fundraiser.id,
                              referral.id,
                              token,
                            );
                            setUnapprovedReferrers((prev) =>
                              prev.filter((ref) => ref.id !== referral.id),
                            );
                            setLoadingId(null);
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ReferralButton({
  referrals,
  onClick,
}: {
  referrals: z.infer<typeof ReferralSchema>[];
  onClick: () => void;
}) {
  const [pending, setPending] = useState(
    referrals.filter((ref) => !ref.approved).length,
  );
  useEffect(() => {
    setPending(referrals.filter((ref) => !ref.approved).length);
  }, [referrals]);

  return (
    <div className="relative inline-flex">
      <Button
        variant="outline"
        onClick={onClick}
        className="text-[#265B34] border border-current bg-transparent hover:bg-[#e6f0ea]"
      >
        Manage Referrals
      </Button>

      {pending > 0 && (
        <Badge
          key={pending}
          variant="destructive"
          className="bg-[#f74545] absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] leading-none"
        >
          {pending}
        </Badge>
      )}
    </div>
  );
}
