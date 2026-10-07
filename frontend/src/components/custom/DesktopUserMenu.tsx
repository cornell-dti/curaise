"use client";

import { signInWithGoogle, signOut } from "@/lib/auth-actions";
import { useLoggedIn } from "@/lib/useLoggedIn";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "../ui/button";

type UserRole = "buyer" | "seller";

export default function DesktopUserMenu({ userRole }: { userRole: UserRole }) {
	const loggedIn = useLoggedIn();

	const navigateToSettings = () => {
		redirect("/account");
	};

	const handleLogin = () => {
		signInWithGoogle();
	};

	const handleLogout = () => {
		signOut();
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					aria-label="Account"
					className="rounded-full">
					<User className="h-5 w-5" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{loggedIn !== false ? (
					<>
						<DropdownMenuItem
							onClick={navigateToSettings}
							className="text-base">
							Settings
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={handleLogout}
							className="text-base text-red-600">
							Log Out
						</DropdownMenuItem>
					</>
				) : (
					<DropdownMenuItem onClick={handleLogin} className="text-base">
						<User className="mr-2 h-4 w-4" />
						<span>Log In</span>
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
