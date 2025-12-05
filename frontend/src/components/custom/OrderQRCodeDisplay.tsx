"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

interface OrderQRCodeDisplayProps {
  orderId: string;
}

export function OrderQRCodeDisplay({ orderId }: OrderQRCodeDisplayProps) {
  const [mounted, setMounted] = useState(false);
  const [sellerOrderUrl, setSellerOrderUrl] = useState("");

  useEffect(() => {
    // Only run on client side after hydration
    setMounted(true);
    setSellerOrderUrl(`${window.location.origin}/seller/order/${orderId}`);
  }, [orderId]);

  return (
    <div className="flex justify-center">
      <div className="bg-white p-4 rounded-lg">
        {mounted ? (
          <QRCodeSVG value={sellerOrderUrl} size={256} level="H" />
        ) : (
          // Placeholder during SSR - matches QR code dimensions
          <div className="w-64 h-64 bg-gray-100 animate-pulse rounded" />
        )}
      </div>
    </div>
  );
}
