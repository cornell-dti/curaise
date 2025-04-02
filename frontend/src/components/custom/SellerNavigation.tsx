import * as React from "react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation";
import { CircleUserRound } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function SellerNavigationMenu() {
  const supabase = createClient();
  const {
    data: { user },
    error: error1,
  } = await (await supabase).auth.getUser();
  if (error1 || !user) {
    redirect("/login");
  }
  return (
    <NavigationMenu className="w-full max-w-none p-4 block bg-gray-200">
      <NavigationMenuList className="flex flex-row justify-between items-center">
        <NavigationMenuItem>CURaise Logo</NavigationMenuItem>

        <NavigationMenuItem className="flex flex-row items-center">
          <CircleUserRound className="w-6 h-6 mr-2" />
          {user?.email?.split("@")[0]}
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
