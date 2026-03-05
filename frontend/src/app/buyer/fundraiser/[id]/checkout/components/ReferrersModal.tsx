"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogDescription } from "@radix-ui/react-dialog";

interface Referral {
  id: string;
  approved: boolean;
  referrer: {
    name: string;
  };
}

interface ReferralSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  approvedReferrals: Referral[];
  unapprovedReferrals: Referral[];

  selectedReferralId: string | null;
  setSelectedReferralId: (id: string) => void;
}

export function ReferrersModal({
  open,
  onOpenChange,
  approvedReferrals,
  unapprovedReferrals,
  selectedReferralId,
  setSelectedReferralId,
}: ReferralSelectionDialogProps) {
  // Local UI state
  const [pendingReferralId, setPendingReferralId] = useState<string | null>(
    selectedReferralId,
  );
  const [referralSearch, setReferralSearch] = useState("");

  // Filter logic
  const filteredApproved = approvedReferrals.filter((ref) =>
    ref.referrer.name.toLowerCase().includes(referralSearch.toLowerCase()),
  );

  const filteredUnapproved = unapprovedReferrals.filter((ref) =>
    ref.referrer.name.toLowerCase().includes(referralSearch.toLowerCase()),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        // Reset state when closing
        if (!o) {
          setReferralSearch("");
          setPendingReferralId(selectedReferralId);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md w-full max-h-[80vh] flex flex-col pb-6 pt-6 px-5">
        <DialogHeader className="mb-4">
          <div className="flex flex-col items-center justify-center w-full">
            <DialogTitle className="text-[18px] font-semibold leading-[27px] text-center">
              Who referred you?
            </DialogTitle>
            <DialogDescription className="text-sm text-center text-muted-foreground">
              {" "}
              Click on the person who referred your order. If no one referred
              you, feel free to click out.{" "}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
          {/* Search Bar */}
          <div className="border border-[#dddddd] rounded-[6px] h-10 px-3 flex items-center gap-2">
            <Search className="h-4 w-4 text-[#969696]" aria-hidden="true" />
            <input
              type="text"
              value={referralSearch}
              onChange={(e) => setReferralSearch(e.target.value)}
              placeholder="Search for a name"
              className="flex-1 bg-transparent text-sm placeholder:text-[#969696] outline-none"
            />
          </div>

          {/* Verified Referrals */}
          {filteredApproved.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-[14px] font-semibold leading-[21px]">
                Verified Referrers
              </p>
              <div className="flex flex-col gap-3">
                {filteredApproved.map((referral) => (
                  <button
                    key={referral.id}
                    type="button"
                    className={`flex items-center gap-3 w-full text-left px-2 py-1 rounded-md ${
                      pendingReferralId === referral.id ? "bg-[#f6f6f6]" : ""
                    }`}
                    onClick={() => setPendingReferralId(referral.id)}
                  >
                    <ShieldCheck className="h-5 w-5 text-black" />
                    <span className="text-[14px] leading-[21px]">
                      {referral.referrer.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Unverified Referrers */}
          {filteredUnapproved.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-[14px] font-semibold leading-[21px]">
                Unverified Referrers
              </p>
              <div className="flex flex-col gap-3">
                {filteredUnapproved.map((referral) => (
                  <button
                    key={referral.id}
                    type="button"
                    className={`flex items-center gap-3 w-full text-left px-2 py-1 rounded-md ${
                      pendingReferralId === referral.id ? "bg-[#f6f6f6]" : ""
                    }`}
                    onClick={() => setPendingReferralId(referral.id)}
                  >
                    <ShieldAlert className="h-5 w-5 text-black" />
                    <span className="text-[14px] leading-[21px]">
                      {referral.referrer.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button
          className="w-full h-[50px] rounded-[8px] bg-black hover:bg-black/90 text-white text-[18px]"
          disabled={!pendingReferralId}
          onClick={() => {
            if (pendingReferralId) setSelectedReferralId(pendingReferralId);
            onOpenChange(false);
          }}
        >
          Update
        </Button>
      </DialogContent>
    </Dialog>
  );
}
