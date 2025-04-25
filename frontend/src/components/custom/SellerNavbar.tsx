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

export default function SellerNavbar() {
	const sellerDesktopButtons = () => {
		return (
			<NavigationMenu>
				<NavigationMenuList>
					<NavigationMenuItem>
						<Link href="/seller" legacyBehavior passHref>
							<NavigationMenuLink
								className={`${navigationMenuTriggerStyle()} text-lg font-medium`}>
								Organizations
							</NavigationMenuLink>
						</Link>
					</NavigationMenuItem>
				</NavigationMenuList>
			</NavigationMenu>
		);
	};
	const sellerMobileButtons = () => {
		return (
			<>
				<SheetClose asChild>
					<Link
						href="/seller"
						className="flex items-center py-2 text-xl font-semibold">
						Organizations
					</Link>
				</SheetClose>
			</>
		);
	};
	return (
		<Navbar
			userRole="seller"
			userDesktopButtons={sellerDesktopButtons()}
			userMobileButtons={sellerMobileButtons()}
		/>
	);
}
