"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { signInWithGoogle, signOut } from "@/lib/auth-actions";
import { LogOut, User } from "lucide-react";
import { redirect, usePathname } from "next/navigation";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserRole = "buyer" | "seller";

export default function MobileUserMenu({ userRole }: { userRole: UserRole }) {
	const [loggedIn, setLoggedIn] = useState(true);
	const pathname = usePathname();

	useEffect(() => {
		const checkLoginStatus = async () => {
			const supabase = await createClient();
			const { data, error } = await supabase.auth.getUser();
			if (error || !data.user) {
				setLoggedIn(false);
			} else {
				setLoggedIn(true);
			}
		};
		checkLoginStatus();
	}, []);

	const navigateToOrganizations = () => {
		redirect("/seller");
	};

	const handleLogout = () => {
		signOut();
	};

	// Check if we're on a settings/account page
	const isAccountPage =
		pathname.includes("/settings") || pathname.includes("/account");

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					className={`flex flex-col items-center justify-center gap-1 ${
						isAccountPage ? "text-primary" : "text-muted-foreground"
					}`}>
					<User className="h-5 w-5" />
					<span className="text-xs">Account</span>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="center" side="top" className="mb-2">
				{loggedIn ? (
					<>
						<DropdownMenuItem
							onClick={navigateToOrganizations}
							className="text-base">
							Organizations
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={handleLogout} className="text-base">
							<LogOut className="mr-2 h-4 w-4" />
							<span>Log Out</span>
						</DropdownMenuItem>
					</>
				) : (
					<DropdownMenuItem onClick={signInWithGoogle} className="text-base">
						<User className="mr-2 h-4 w-4" />
						<span>Log In</span>
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
