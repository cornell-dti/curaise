"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { mutationFetch } from "@/lib/fetcher";

// How long the undo toast stays up. The backend allows undo for 1 minute,
// but the toast is a misclick guard, so it only offers it briefly.
export const PICKUP_UNDO_TOAST_MS = 10_000;

// Sonner toasts default to a fixed width; these only need to fit their text.
const fitToastStyle = { width: "fit-content" } as const;

export function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return "Failed to update pickup status";
}

function UndoPickupButton({
  orderId,
  token,
  toastId,
  onUndone,
}: {
  orderId: string;
  token: string;
  toastId: string | number;
  onUndone?: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(PICKUP_UNDO_TOAST_MS / 1000);
  const [isUndoing, setIsUndoing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleUndo = async () => {
    setIsUndoing(true);
    try {
      await mutationFetch(`/order/${orderId}/undo-pickup`, { token });
      toast.dismiss(toastId);
      toast.success("Pickup undone", { style: fitToastStyle });
      onUndone?.();
    } catch (error) {
      toast.error(
        getErrorMessage(error) || "Undo window expired or request failed.",
      );
    } finally {
      setIsUndoing(false);
    }
  };

  return (
    <div className="ml-2">
      <button
        onClick={handleUndo}
        disabled={isUndoing || secondsLeft === 0}
        className="inline-flex items-center gap-1 rounded-md border border-green-600 bg-white px-3 py-1 text-sm font-semibold text-green-600 shadow-sm hover:bg-green-50 hover:text-green-700 disabled:opacity-50 disabled:pointer-events-none tabular-nums"
      >
        {isUndoing ? "Undoing..." : `Undo (${secondsLeft}s)`}
      </button>
    </div>
  );
}

// Shows the "Order marked as picked up" toast with a countdown Undo button.
// Used by the fundraiser orders table and the seller order details page.
export function showPickupUndoToast(
  orderId: string,
  token: string,
  onUndone?: () => void,
) {
  const toastId = `pickup-${orderId}-${Date.now()}`;
  toast("Order marked as picked up", {
    id: toastId,
    duration: PICKUP_UNDO_TOAST_MS,
    style: fitToastStyle,
    action: (
      <UndoPickupButton
        orderId={orderId}
        token={token}
        toastId={toastId}
        onUndone={onUndone}
      />
    ),
  });
}
