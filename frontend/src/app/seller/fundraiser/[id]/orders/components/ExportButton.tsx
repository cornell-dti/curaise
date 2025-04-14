'use client';

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";
import { CompleteOrderSchema } from "common/schemas/order";
import { z } from "zod";

type Order = z.infer<typeof CompleteOrderSchema>;

export function ExportButton({ orders, fundraiserName }: { orders: Order[], fundraiserName: string }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    
    try {
      const headers = [
        "Name", 
        "Email", 
        "NetID", 
        "Order Details", 
        "Payment Method", 
        "Payment Status", 
        "Pickup Status", 
        "Order Total"
      ];
      
      const rows = orders.map(order => {
        const orderTotal = order.items.reduce(
          (total, item) => total + item.quantity * Number(item.item.price), 0
        );
        
        const orderDetails = order.items.map(item => 
          `${item.quantity} ${item.item.name}`
        ).join(", ");
        
        return [
          order.buyer?.name || "Unknown",
          order.buyer?.email || "Unknown",
          order.buyer?.email?.split('@')[0] || "Unknown",
          orderDetails,
          order.paymentMethod || "Unknown",
          order.paymentStatus || "Unknown",
          order.pickedUp ? "Picked Up" : "Not Picked Up",
          `$${orderTotal.toFixed(2)}`
        ];
      });
      
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
      ].join("\n");
      
      // Create blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Set up download
      const date = new Date().toISOString().split('T')[0];
      link.href = url;
      link.setAttribute('download', `${fundraiserName.replace(/\s+/g, '-')}-orders-${date}.csv`);
      document.body.appendChild(link);
      
      // Trigger download and clean up
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting orders:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      className="h-10 px-4" 
      onClick={handleExport}
      disabled={isExporting}
    >
      {isExporting ? "Exporting..." : "Export"}
      <Download className="ml-2 h-5 w-5" />
    </Button>
  );
}
