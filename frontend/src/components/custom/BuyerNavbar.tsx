"use client";

import Navbar from "@/components/custom/Navbar";
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { SheetClose } from "@/components/ui/sheet";
import Link from "next/link";

export default function BuyerNavbar() {
	const buyerDesktopButtons = () => {
		return (
			<NavigationMenu>
				<NavigationMenuList>
					<NavigationMenuItem>
						<Link href="/buyer/browse" legacyBehavior passHref>
							<NavigationMenuLink className={navigationMenuTriggerStyle()}>
								Browse
							</NavigationMenuLink>
						</Link>
					</NavigationMenuItem>
					<NavigationMenuItem>
						<Link href="/buyer" legacyBehavior passHref>
							<NavigationMenuLink className={navigationMenuTriggerStyle()}>
								Orders
							</NavigationMenuLink>
						</Link>
					</NavigationMenuItem>
				</NavigationMenuList>
			</NavigationMenu>
		);
	};
	const buyerMobileButtons = () => {
		return (
			<>
				<SheetClose asChild>
					<Link
						href="/buyer"
						className="flex items-center py-2 text-xl font-semibold">
						Browse
					</Link>
				</SheetClose>
				<SheetClose asChild>
					<Link
						href="/buyer"
						className="flex items-center py-2 text-xl font-semibold">
						Orders
					</Link>
				</SheetClose>
			</>
		);
	};
	return (
		<Navbar
			userRole="buyer"
			desktopButtons={buyerDesktopButtons()}
			mobileButtons={buyerMobileButtons()}
		/>
	);
}
