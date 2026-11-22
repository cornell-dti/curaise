"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CompleteOrderSchema, ReferralSchema } from "common";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocalDate } from "@/components/ui/LocalDate";
import { mutationFetch } from "@/lib/fetcher";

type Order = z.infer<typeof CompleteOrderSchema>;
type Referral = z.infer<typeof ReferralSchema>;

// Radix Select can't use "" as an item value
const NO_REFERRER = "none";

interface OrderReferrerEditorProps {
  order: Order;
  // All of the fundraiser's referrals; only approved ones can be picked
  referrals: Referral[];
}

const netId = (email: string) => email.split("@")[0];

export function OrderReferrerEditor({
  order,
  referrals,
}: OrderReferrerEditorProps) {
  const router = useRouter();
  const currentId = order.referral?.id ?? NO_REFERRER;
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(currentId);
  const [isSaving, setIsSaving] = useState(false);
  // Stays true until the refreshed server data (new referrer, audit line) lands
  const [isRefreshing, startRefresh] = useTransition();
  const isBusy = isSaving || isRefreshing;

  const approvedReferrals = referrals
    .filter((referral) => referral.approved)
    .sort((a, b) => a.referrer.name.localeCompare(b.referrer.name));
  // Keep a checkout referrer who is still pending selectable, so opening the
  // editor doesn't silently show the wrong value.
  const options =
    order.referral && !order.referral.approved
      ? [order.referral, ...approvedReferrals]
      : approvedReferrals;

  const startEditing = () => {
    setSelectedId(currentId);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (selectedId === currentId) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await mutationFetch(`/order/${order.id}/referral`, {
        body: { referralId: selectedId === NO_REFERRER ? null : selectedId },
      });
      const picked = options.find((r) => r.id === selectedId);
      toast.success(
        picked
          ? `Order credited to ${picked.referrer.name}`
          : "Referrer removed from order",
      );
      startRefresh(() => {
        setIsEditing(false);
        router.refresh();
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update referrer",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="mt-1 space-y-2">
        <Select
          value={selectedId}
          onValueChange={setSelectedId}
          disabled={isBusy}
        >
          <SelectTrigger className="w-full sm:w-72" aria-label="Referrer">
            <SelectValue placeholder="Choose a referrer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_REFERRER}>No referrer</SelectItem>
            {options.map((referral) => (
              <SelectItem key={referral.id} value={referral.id}>
                {referral.referrer.name} ({netId(referral.referrer.email)})
                {!referral.approved && " · pending"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {approvedReferrals.length === 0 && (
          <p className="text-xs text-muted-foreground">
            This fundraiser has no approved referrers yet.
          </p>
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isBusy || selectedId === currentId}
          >
            {isBusy ? "Saving..." : "Save"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(false)}
            disabled={isBusy}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-0.5">
      {order.referral ? (
        <>
          <p className="text-sm">{order.referral.referrer.name}</p>
          <p className="text-sm text-muted-foreground break-all">
            {order.referral.referrer.email}
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No referral</p>
      )}
      {order.referralUpdatedAt && order.referralUpdatedBy && (
        <p className="text-xs text-muted-foreground mt-1">
          Changed by {order.referralUpdatedBy.name} on{" "}
          <LocalDate
            date={order.referralUpdatedAt}
            formatStr="MMM d, yyyy h:mm a"
          />
        </p>
      )}
      <Button
        variant="link"
        size="sm"
        className="h-auto p-0 mt-1 gap-1"
        onClick={startEditing}
      >
        <Pencil className="h-3 w-3" />
        {order.referral ? "Change referrer" : "Add referrer"}
      </Button>
    </div>
  );
}
