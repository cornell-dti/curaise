"use client";

import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Store, Package, Menu } from "lucide-react";
import DesktopUserMenu from "./DesktopUserMenu";
import MobileUserMenu from "./MobileUserMenu";
import useStore from "@/lib/store/useStore";
import { useCartStore } from "@/lib/store/useCartStore";
import { SearchBar } from "./SearchBar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-actions";

export default function Navbar() {
	const pathname = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();

	// Determine user role based on pathname
	const isBuyer = pathname.startsWith("/buyer");
	const isSeller = pathname.startsWith("/seller");
	const userRole = isBuyer ? "buyer" : isSeller ? "seller" : "buyer";

	// Show search bar logic
	const showSearchBar = pathname.includes("/buyer/browse");

	// Shopping cart logic (buyer only)
	const showCart =
		pathname.includes("/buyer/fundraiser/") && !pathname.includes("/checkout");

	const getFundraiserId = () => {
		if (
			pathname.includes("/buyer/fundraiser/") &&
			!pathname.includes("/checkout")
		) {
			const segments = pathname.split("/");
			return segments[segments.length - 1];
		}
		return undefined;
	};

	const fundraiserId = getFundraiserId();
	const cart =
		useStore(useCartStore, (state) => state.carts[fundraiserId ?? ""]) || [];

	const totalQuantity = cart.reduce(
		(total, cartItem) => total + cartItem.quantity,
		0,
	);

	// Search handlers
	const handleSearchChange = (query: string) => {
		const params = new URLSearchParams(searchParams.toString());
		if (query) {
			params.set("search", query);
		} else {
			params.delete("search");
		}
		router.push(`${pathname}?${params.toString()}`);
	};

	// Hide top navbar on mobile for fundraiser pages
	const isFundraiserPage =
		pathname.includes("/buyer/fundraiser/") && !pathname.includes("/checkout");
	const hideTopNavbarOnMobile = isFundraiserPage;

	return (
		<>
			<header
				className={`sticky top-0 z-50 w-full border-b bg-background ${
					pathname.includes("/buyer/browse") && showSearchBar
						? "md:h-20"
						: "h-16 md:h-20"
				} ${hideTopNavbarOnMobile ? "hidden md:block" : ""}`}>
				<div
					className={`relative flex items-center px-4 md:px-[157px] ${
						pathname.includes("/buyer/browse") && showSearchBar
							? "h-0 md:h-20"
							: "h-16 md:h-20"
					}`}>
					{/* Logo - Desktop */}
					<div className="hidden md:flex items-center flex-shrink-0">
						<Link
							href={isBuyer ? "/buyer" : "/seller"}
							className="text-2xl font-bold">
							CURaise
						</Link>
					</div>

					{/* Logo - Mobile (centered) - Hidden on browse page and fundraiser pages */}
					{!pathname.includes("/buyer/browse") && !isFundraiserPage && (
						<div className="md:hidden flex items-center justify-center w-full">
							<Link
								href={isBuyer ? "/buyer" : "/seller"}
								className="text-2xl font-bold">
								CURaise
							</Link>
						</div>
					)}

					{/* Mobile Search Bar - Top - Full width */}
					{showSearchBar && (
						<div className="md:hidden absolute top-0 left-0 right-0 px-4 py-4 bg-background w-full">
							<SearchBar onSearchChange={handleSearchChange} />
						</div>
					)}

					{/* Desktop Search Bar - Centered with responsive width */}
					{showSearchBar && (
						<div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 w-48 lg:w-64 xl:w-80 2xl:w-96 pointer-events-auto">
							<SearchBar onSearchChange={handleSearchChange} />
						</div>
					)}

					{/* Desktop Navigation - With even spacing */}
					<div className="hidden md:flex ml-auto gap-4 flex-shrink-0">
						{showSearchBar ? (
							<>
								{/* Dropdown menu for small/medium screens only */}
								<div className="xl:hidden">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												className="flex items-center gap-2">
												<Menu className="h-5 w-5" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem asChild>
												<Link href="/buyer/browse" className="cursor-pointer">
													Browse
												</Link>
											</DropdownMenuItem>
											<DropdownMenuItem asChild>
												<Link href="/buyer" className="cursor-pointer">
													Orders
												</Link>
											</DropdownMenuItem>
											<DropdownMenuSub>
												<DropdownMenuSubTrigger>Account</DropdownMenuSubTrigger>
												<DropdownMenuPortal>
													<DropdownMenuSubContent>
														<DropdownMenuItem asChild>
															<Link href="/seller" className="cursor-pointer">
																Organizations
															</Link>
														</DropdownMenuItem>
														<DropdownMenuItem asChild>
															<Link href="/account" className="cursor-pointer">
																Settings
															</Link>
														</DropdownMenuItem>
														<DropdownMenuItem
															className="text-red-600 cursor-pointer"
															onClick={() => signOut()}>
															Sign out
														</DropdownMenuItem>
													</DropdownMenuSubContent>
												</DropdownMenuPortal>
											</DropdownMenuSub>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
								{/* Full navigation for XL screens and up */}
								<div className="hidden xl:flex">
									<NavigationMenu>
										<NavigationMenuList>
											<>
												<NavigationMenuItem>
													<NavigationMenuLink
														asChild
														className={navigationMenuTriggerStyle()}>
														<Link href="/buyer/browse">Browse </Link>
													</NavigationMenuLink>
												</NavigationMenuItem>
												<NavigationMenuItem>
													<NavigationMenuLink
														asChild
														className={navigationMenuTriggerStyle()}>
														<Link href="/buyer">Orders</Link>
													</NavigationMenuLink>
												</NavigationMenuItem>
											</>
										</NavigationMenuList>
									</NavigationMenu>
									<DesktopUserMenu userRole={userRole} />
								</div>
							</>
						) : (
							<div className="hidden xl:flex">
								<NavigationMenu>
									<NavigationMenuList>
										<>
											<NavigationMenuItem>
												<NavigationMenuLink
													asChild
													className={navigationMenuTriggerStyle()}>
													<Link href="/buyer/browse">Browse</Link>
												</NavigationMenuLink>
											</NavigationMenuItem>
											<NavigationMenuItem>
												<NavigationMenuLink
													asChild
													className={navigationMenuTriggerStyle()}>
													<Link href="/buyer">Orders </Link>
												</NavigationMenuLink>
											</NavigationMenuItem>
											{/* {showCart && fundraiserId && (
												<NavigationMenuItem>
													<NavigationMenuTrigger className="gap-2">
														Cart{" "}
														{fundraiserId && totalQuantity > 0 && (
															<Badge
																variant="destructive"
																className="p-0 w-5 h-5 flex justify-center text-[10px] font-medium rounded-full">
																{totalQuantity}
															</Badge>
														)}
													</NavigationMenuTrigger>
													<NavigationMenuContent>
														<div className="w-[300px] p-4">
															<ShoppingCart fundraiserId={fundraiserId} />
														</div>
													</NavigationMenuContent>
												</NavigationMenuItem>
											)} */}
										</>
									</NavigationMenuList>
								</NavigationMenu>
								<DesktopUserMenu userRole={userRole} />
							</div>
						)}
					</div>
				</div>
			</header>
			{/* Mobile Bottom Navigation */}
			<nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
				<div className="flex items-center justify-around h-16 px-4">
					<Link
						href="/buyer/browse"
						className={`flex flex-col items-center justify-center flex-1 gap-1 ${
							pathname === "/buyer/browse"
								? "text-primary"
								: "text-muted-foreground"
						}`}>
						<Store className="h-5 w-5" />
						<span className="text-xs">Browse</span>
					</Link>

					<Link
						href="/buyer"
						className={`flex flex-col items-center justify-center flex-1 gap-1 ${
							pathname === "/buyer" ? "text-primary" : "text-muted-foreground"
						}`}>
						<Package className="h-5 w-5" />
						<span className="text-xs">Orders</span>
					</Link>

					<div className="flex flex-col items-center justify-center flex-1 gap-1">
						<MobileUserMenu userRole={userRole} />
					</div>
				</div>
			</nav>
		</>
	);
}
