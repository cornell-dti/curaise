"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";
import { CompleteOrderSchema } from "common/schemas/order";
import { z } from "zod";
import { buildOrdersCsv } from "./ordersCsv";

type Order = z.infer<typeof CompleteOrderSchema>;

export function ExportButton({
	orders,
	fundraiserName,
	label = "Export",
}: {
	orders: Order[];
	fundraiserName: string;
	label?: string;
}) {
	const [isExporting, setIsExporting] = useState(false);

	const handleExport = () => {
		setIsExporting(true);

		try {
			const csvContent = buildOrdersCsv(orders);

			// Create blob and download link
			const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");

			// Set up download
			const date = new Date().toISOString().split("T")[0];
			link.href = url;
			link.setAttribute(
				"download",
				`${fundraiserName.replace(/\s+/g, "-")}-orders-${date}.csv`
			);
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
			className="font-[400] px-3 shadow-none rounded-lg border border-solid border-[#68b0ab]"
			onClick={handleExport}
			disabled={isExporting || orders.length === 0}>
			{isExporting ? "Exporting..." : label}
			<Download className="ml-2 h-5 w-5" />
		</Button>
	);
}
