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
import { useState } from "react";
import { toast } from "sonner";
import { mutationFetch } from "@/lib/fetcher";
import { useReferrals } from "../referrals/components/ReferralsProvider";

export function ReferralApprovalModal({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const { referrals, fundraiserId, refetch } = useReferrals();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const unapprovedReferrers = referrals.filter((ref) => !ref.approved);

  // Runs an approve or deny request. The row only leaves the list once the
  // shared referrals list is refetched, so a failed request keeps it in place.
  const resolve = async (
    referralId: string,
    action: "approve" | "deny",
  ) => {
    if (loadingId) return;
    setLoadingId(referralId);
    try {
      if (action === "approve") {
        await mutationFetch(
          `/fundraiser/${fundraiserId}/referrals/${referralId}/approve`,
          {},
        );
      } else {
        await mutationFetch(
          `/fundraiser/${fundraiserId}/referrals/${referralId}/delete`,
          { method: "DELETE" },
        );
      }
      await refetch();
      toast.success(
        action === "approve" ? "Referrer approved!" : "Referrer denied",
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : `Failed to ${action} referrer`,
      );
    } finally {
      setLoadingId(null);
    }
  };

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
                          disabled={loadingId !== null}
                          onClick={() => resolve(referral.id, "approve")}
                          className="text-[#265B34] border border-current bg-transparent hover:bg-[#e6f0ea]"
                        >
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={loadingId !== null}
                          onClick={() => resolve(referral.id, "deny")}
                          className="text-[#f74545] bg-transparent hover:bg-[#fdeaea] hover:text-[#f74545]"
                        >
                          Deny
                        </Button>
                      </span>
                    </div>
                    {idx < unapprovedReferrers.length - 1 && (
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

export function ReferralButton({ onClick }: { onClick: () => void }) {
  const { referrals } = useReferrals();
  const pending = referrals.filter((ref) => !ref.approved).length;

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
          variant="destructive"
          className="bg-[#f74545] absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] leading-none"
        >
          {pending}
        </Badge>
      )}
    </div>
  );
}
