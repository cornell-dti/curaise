"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ReferralWithQuantities } from "./ReferralsTableColumns";

export function ReferralsExportButton({
	referrals,
	fundraiserName,
	includePending,
}: {
	referrals: ReferralWithQuantities[];
	fundraiserName: string;
	includePending: boolean;
}) {
	const handleExport = () => {
		const money = (amount: number) => `$${amount.toFixed(2)}`;
		const headers = [
			"Name",
			"Email",
			"NetID",
			...(includePending
				? [
						"Confirmed Orders",
						"Pending Orders",
						"Total Orders",
						"Confirmed Amount Raised",
						"Pending Amount Raised",
						"Total Amount Raised",
				  ]
				: ["Orders", "Amount Raised"]),
			"Status",
		];

		const rows = referrals.map((referral) => [
			referral.referrer.name,
			referral.referrer.email,
			referral.referrer.email.split("@")[0],
			...(includePending
				? [
						String(referral.orderCount),
						String(referral.pendingOrderCount),
						String(referral.attributedOrderCount),
						money(referral.amountRaised),
						money(referral.pendingAmount),
						money(referral.totalAmount),
				  ]
				: [String(referral.orderCount), money(referral.amountRaised)]),
			referral.approved ? "Approved" : "Pending",
		]);

		const csvContent = [
			headers.join(","),
			...rows.map((row) =>
				row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","),
			),
		].join("\n");

		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		const date = new Date().toISOString().split("T")[0];
		link.href = url;
		link.setAttribute(
			"download",
			`${fundraiserName.replace(/\s+/g, "-")}-referrals-${date}.csv`,
		);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	return (
		<Button
			variant="outline"
			className="font-[400] px-3 shadow-none rounded-lg border border-solid border-[#68b0ab]"
			onClick={handleExport}
			disabled={referrals.length === 0}>
			Export
			<Download className="ml-2 h-5 w-5" />
		</Button>
	);
}
