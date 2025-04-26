"use client";

import Link from "next/link";
import { Menu, User, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { signInWithGoogle, signOut } from "@/lib/auth-actions";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

type UserRole = "buyer" | "seller";

type NavbarProps = {
	userRole: UserRole;
	desktopButtons?: React.ReactNode;
	mobileButtons?: React.ReactNode;
};

export default function Navbar({
	userRole,
	desktopButtons,
	mobileButtons,
}: NavbarProps) {
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

	const toggleRole = () => {
		if (userRole === "buyer") {
			redirect("/seller");
		} else if (userRole === "seller") {
			redirect("/buyer");
		}
	};

	const handleLogout = () => {
		signOut();
	};

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background">
			<div className="flex h-16 items-center justify-between px-4 md:px-8 lg:px-12">
				{/* Logo */}
				<div className="flex items-center">
					<Link href="/" className="text-2xl font-bold">
						CURaise
					</Link>
				</div>

				{/* Desktop Navigation - With even spacing */}
				<div className="hidden md:flex md:flex-1 justify-end">
					{desktopButtons}
				</div>

				{/* User Menu (Desktop) */}
				<div className="hidden md:flex md:items-center">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="rounded-full ml-2">
								<User className="h-5 w-5" />
								<span className="sr-only">User menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-35">
							{loggedIn ? (
								<>
									<DropdownMenuItem onClick={toggleRole} className="text-base">
										Switch to {userRole === "buyer" ? "Seller" : "Buyer"}
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={handleLogout}
										className="text-base">
										<LogOut className="mr-2 h-4 w-4" />
										<span>Log Out</span>
									</DropdownMenuItem>
								</>
							) : (
								<DropdownMenuItem
									onClick={signInWithGoogle}
									className="text-base">
									<User className="mr-2 h-4 w-4" />
									<span>Log In</span>
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				{/* Mobile Menu */}
				<div className="md:hidden">
					<Sheet>
						<SheetTrigger asChild>
							<Button variant="ghost" size="icon" className="md:hidden">
								<Menu className="h-5 w-5" />
								<span className="sr-only">Toggle Menu</span>
							</Button>
						</SheetTrigger>
						<SheetContent side="top">
							<SheetHeader className="mb-4">
								<SheetTitle className="text-2xl">CURaise</SheetTitle>
							</SheetHeader>
							<div className="grid gap-4 py-4">
								{mobileButtons}
								{loggedIn ? (
									<div className="border-t pt-4">
										<Button
											variant="outline"
											className="w-full justify-start text-lg"
											onClick={toggleRole}>
											Switch to {userRole === "buyer" ? "Seller" : "Buyer"}
										</Button>

										<Button
											variant="outline"
											className="mt-2 w-full justify-start text-lg"
											onClick={handleLogout}>
											<LogOut className="mr-2 h-4 w-4" />
											Log out
										</Button>
									</div>
								) : (
									<Button
										variant="outline"
										className="w-full justify-start text-lg"
										onClick={signInWithGoogle}>
										<User className="mr-2 h-4 w-4" />
										Log in
									</Button>
								)}
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</header>
	);
}
