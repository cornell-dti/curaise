"use client";

import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import { CopyButton } from "@/components/custom/CopyButton";

interface OrderQRCodeDialogProps {
  orderId: string;
  variant?: "default" | "floating";
}

export function OrderQRCodeDialog({ orderId, variant = "default" }: OrderQRCodeDialogProps) {
  // Generate the seller order URL
  const sellerOrderUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/seller/order/${orderId}`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {variant === "floating" ? (
          <Button
            className="rounded-xl shadow-md bg-transparent hover:bg-gray-100 p-0 flex items-center justify-center border-2 border-primary"
            style={{ width: '64px', height: '64px' }}
          >
            <QrCode className="text-black" style={{ width: '48px', height: '48px' }} />
          </Button>
        ) : (
          <Button variant="outline" size="lg" className="gap-2 text-base px-6 py-3">
            <QrCode className="h-5 w-5" />
            Show QR Code
          </Button>
        )}
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-md rounded-lg items-center"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex gap-2 justify-center items-center w-full">
            <DialogTitle>Order Pickup QR Code</DialogTitle>
            <CopyButton text={sellerOrderUrl} />
          </div>
          <DialogDescription>
            Show this QR code to the seller at pickup
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-lg">
            <QRCodeSVG value={sellerOrderUrl} size={360} level="H" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
