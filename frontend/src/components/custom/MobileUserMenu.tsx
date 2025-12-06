"use client";

import { User } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

type UserRole = "buyer" | "seller";

export default function MobileUserMenu({ userRole }: { userRole: UserRole }) {
	const pathname = usePathname();

	// Check if we're on a settings/account page
	const isAccountPage =
		pathname.includes("/settings") || pathname.includes("/account-actions");

	return (
		<Link
			href="/account-actions"
			className={`flex flex-col items-center justify-center gap-1 ${
				isAccountPage ? "text-primary" : "text-muted-foreground"
			}`}>
			<User className="h-5 w-5" />
			<span className="text-xs">Account</span>
		</Link>
	);
}
