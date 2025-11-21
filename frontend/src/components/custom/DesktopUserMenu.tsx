"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { signInWithGoogle, signOut } from "@/lib/auth-actions";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, ChevronDown } from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "../ui/button";

type UserRole = "buyer" | "seller";

export default function DesktopUserMenu({ userRole }: { userRole: UserRole }) {
	const [loggedIn, setLoggedIn] = useState(true);

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

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="ml-2 flex items-center gap-1 text-base font-normal">
					Account
					<ChevronDown className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-35">
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
