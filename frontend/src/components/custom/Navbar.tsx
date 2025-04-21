"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { ShoppingBag, User, Menu, X, Store } from "lucide-react";
import { useState } from "react";
import {
	Sheet,
	SheetContent,
	SheetTrigger,
	SheetClose,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";

export function Navbar() {
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);
	const [isSeller, setIsSeller] = useState(false);

	// Apply consistent styling to navigation links
	const navLinkStyle = (path: string) =>
		cn(
			"group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary focus:outline-none disabled:pointer-events-none disabled:opacity-50",
			pathname === path && "bg-primary/10 text-primary"
		);

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
			<div className="flex h-16 items-center justify-between px-4 w-full">
				{/* Left side - Logo and mobile menu */}
				<div className="flex items-center gap-2">
					<Sheet open={isOpen} onOpenChange={setIsOpen}>
						<SheetTrigger asChild className="md:hidden">
							<Button
								variant="ghost"
								size="icon"
								className="rounded-full hover:bg-primary/10">
								<Menu className="h-5 w-5 text-primary" />
								<span className="sr-only">Toggle menu</span>
							</Button>
						</SheetTrigger>
						<SheetContent
							side="left"
							className="w-[240px] sm:w-[300px] border-r-primary/10">
							<div className="flex h-full flex-col">
								<div className="flex items-center justify-between border-b px-2 py-4">
									<Link href="/" className="flex items-center gap-2 font-bold">
										<div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
											<ShoppingBag className="h-4 w-4 text-primary" />
										</div>
										<span className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
											CURaise
										</span>
									</Link>
									<SheetClose asChild>
										<Button
											variant="ghost"
											size="icon"
											className="rounded-full hover:bg-primary/10">
											<X className="h-5 w-5 text-primary" />
											<span className="sr-only">Close</span>
										</Button>
									</SheetClose>
								</div>
								<div className="flex items-center gap-2 px-4 py-3 border-b">
									<span className="text-sm font-medium">Buyer</span>
									<Switch checked={isSeller} onCheckedChange={setIsSeller} />
									<span className="text-sm font-medium">Seller</span>
								</div>
								<nav className="flex-1 overflow-auto py-4">
									<ul className="grid gap-1 px-2">
										{isSeller ? (
											<>
												<li>
													<Link
														href="/dashboard"
														className={cn(
															"flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary",
															pathname === "/dashboard" &&
																"bg-primary/10 text-primary"
														)}
														onClick={() => setIsOpen(false)}>
														Dashboard
													</Link>
												</li>
												<li>
													<Link
														href="/campaigns"
														className={cn(
															"flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary",
															pathname === "/campaigns" &&
																"bg-primary/10 text-primary"
														)}
														onClick={() => setIsOpen(false)}>
														My Campaigns
													</Link>
												</li>
												<li>
													<Link
														href="/analytics"
														className={cn(
															"flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary",
															pathname === "/analytics" &&
																"bg-primary/10 text-primary"
														)}
														onClick={() => setIsOpen(false)}>
														Analytics
													</Link>
												</li>
											</>
										) : (
											<>
												<li>
													<Link
														href="/"
														className={cn(
															"flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary",
															pathname === "/" && "bg-primary/10 text-primary"
														)}
														onClick={() => setIsOpen(false)}>
														Home
													</Link>
												</li>
												<li>
													<Link
														href="/fundraisers"
														className={cn(
															"flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary",
															pathname === "/fundraisers" &&
																"bg-primary/10 text-primary"
														)}
														onClick={() => setIsOpen(false)}>
														Fundraisers
													</Link>
												</li>
												<li>
													<Link
														href="/orders"
														className={cn(
															"flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary",
															pathname === "/orders" &&
																"bg-primary/10 text-primary"
														)}
														onClick={() => setIsOpen(false)}>
														My Orders
													</Link>
												</li>
											</>
										)}
									</ul>
								</nav>
								<div className="border-t p-4">
									<Button
										asChild
										className="w-full bg-primary hover:bg-primary/90 transition-all duration-200 shadow-sm">
										<Link href="/login" onClick={() => setIsOpen(false)}>
											<User className="mr-2 h-4 w-4" />
											Login
										</Link>
									</Button>
								</div>
							</div>
						</SheetContent>
					</Sheet>
					<Link href="/" className="flex items-center gap-3">
						<div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 transition-transform hover:scale-105">
							<ShoppingBag className="h-5 w-5 text-primary" />
						</div>
						<span className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent hidden sm:inline-block">
							CURaise
						</span>
					</Link>
				</div>

				{/* Middle - Navigation */}
				<NavigationMenu className="hidden md:flex">
					<NavigationMenuList className="gap-1">
						{isSeller ? (
							<>
								<NavigationMenuItem>
									<Link href="/dashboard" legacyBehavior passHref>
										<NavigationMenuLink className={navLinkStyle("/dashboard")}>
											Dashboard
										</NavigationMenuLink>
									</Link>
								</NavigationMenuItem>
								<NavigationMenuItem>
									<Link href="/campaigns" legacyBehavior passHref>
										<NavigationMenuLink className={navLinkStyle("/campaigns")}>
											My Campaigns
										</NavigationMenuLink>
									</Link>
								</NavigationMenuItem>
								<NavigationMenuItem>
									<Link href="/analytics" legacyBehavior passHref>
										<NavigationMenuLink className={navLinkStyle("/analytics")}>
											Analytics
										</NavigationMenuLink>
									</Link>
								</NavigationMenuItem>
							</>
						) : (
							<>
								<NavigationMenuItem>
									<Link href="/" legacyBehavior passHref>
										<NavigationMenuLink className={navLinkStyle("/")}>
											Home
										</NavigationMenuLink>
									</Link>
								</NavigationMenuItem>
								<NavigationMenuItem>
									<NavigationMenuTrigger className="h-10 px-4 hover:bg-primary/10 hover:text-primary data-[state=open]:bg-primary/10 data-[state=open]:text-primary transition-all duration-200">
										Fundraisers
									</NavigationMenuTrigger>
									<NavigationMenuContent>
										<ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
											<li className="row-span-3">
												<NavigationMenuLink asChild>
													<a
														className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-primary/5 to-primary/20 p-6 no-underline outline-none focus:shadow-md transition-all duration-200 hover:from-primary/10 hover:to-primary/30"
														href="/fundraisers">
														<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 mb-2">
															<ShoppingBag className="h-6 w-6 text-primary" />
														</div>
														<div className="mb-2 mt-4 text-lg font-medium">
															Browse Fundraisers
														</div>
														<p className="text-sm leading-tight text-muted-foreground">
															Explore all active fundraising campaigns and
															support your community.
														</p>
													</a>
												</NavigationMenuLink>
											</li>
											<li>
												<Link
													href="/fundraisers/featured"
													legacyBehavior
													passHref>
													<NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-all duration-200 hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary">
														<div className="text-sm font-medium leading-none">
															Featured
														</div>
														<p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
															Highlighted fundraising campaigns
														</p>
													</NavigationMenuLink>
												</Link>
											</li>
											<li>
												<Link
													href="/fundraisers/upcoming"
													legacyBehavior
													passHref>
													<NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-all duration-200 hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary">
														<div className="text-sm font-medium leading-none">
															Upcoming
														</div>
														<p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
															Soon-to-launch fundraising events
														</p>
													</NavigationMenuLink>
												</Link>
											</li>
										</ul>
									</NavigationMenuContent>
								</NavigationMenuItem>
								<NavigationMenuItem>
									<Link href="/orders" legacyBehavior passHref>
										<NavigationMenuLink className={navLinkStyle("/orders")}>
											My Orders
										</NavigationMenuLink>
									</Link>
								</NavigationMenuItem>
							</>
						)}
					</NavigationMenuList>
				</NavigationMenu>

				{/* Right side - Toggle and Login button */}
				<div className="flex items-center">
					<div className="flex items-center mr-4">
						<span className="text-sm font-medium mr-2">Buyer</span>
						<Switch checked={isSeller} onCheckedChange={setIsSeller} />
						<span className="text-sm font-medium ml-2">Seller</span>
					</div>
					<Button
						asChild
						variant="default"
						size="sm"
						className="bg-black text-white hover:bg-black/90 transition-all duration-200 rounded-md px-4">
						<Link href="/login">
							<User className="mr-2 h-4 w-4" />
							Login
						</Link>
					</Button>
				</div>
			</div>
		</header>
	);
}
