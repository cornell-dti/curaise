"use client";

import Navbar from "@/components/custom/Navbar";
import { usePathname } from "next/navigation";

export default function SellerLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const pathname = usePathname();

	// Add extra padding on mobile when search bar is visible
	const showSearchBar = pathname === "/seller";
	const topPadding = showSearchBar ? "pt-32 md:pt-16" : "pt-16";

	return (
		<div className="flex flex-col min-h-screen">
			<div className="fixed top-0 left-0 right-0 z-50">
				<Navbar />
			</div>
			<main className={`flex-grow ${topPadding} pb-20 md:pb-0`}>
				{children}
			</main>
		</div>
	);
}
