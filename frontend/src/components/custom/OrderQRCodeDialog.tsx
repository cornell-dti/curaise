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
            className="rounded-xl shadow-md bg-white hover:bg-gray-100 p-0.5 flex items-center justify-center border-2 border-primary"
            style={{ width: '64px', height: '64px' }}
          >
            <QRCodeSVG value={sellerOrderUrl} size={60} level="H" />
          </Button>
        ) : (
          <Button variant="outline" size="lg" className="gap-2 text-base px-6 py-3">
            <QrCode className="h-5 w-5" />
            Show QR Code
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle>Order Pickup QR Code</DialogTitle>
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
