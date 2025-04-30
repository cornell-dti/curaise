import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenuItem,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/server";
import { Users } from "lucide-react";
import { redirect } from "next/navigation";
import { House, ChartLine, ShoppingBag } from "lucide-react";
import { connection } from "next/server";
import { z } from "zod";
import { CompleteFundraiserSchema } from "common";

// TODO: @STEVEN FIX A LOT
export async function SellerSidebar({
  fundraiser,
}: {
  fundraiser: z.infer<typeof CompleteFundraiserSchema>;
}) {
  await connection(); // ensures server component is dynamically rendered at runtime, not statically rendered at build time

  const supabase = createClient();

  const {
    data: { user },
    error: error1,
  } = await (await supabase).auth.getUser();

  if (error1 || !user) {
    redirect("/login");
  }

  return (
    <Sidebar className="h-screen flex flex-col items-center justify-center">
      <SidebarContent className="flex flex-col items-center mt-[25vh] h-full">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-7">
              <SidebarMenuItem key="home">
                <SidebarMenuButton
                  asChild
                  className="p-3 w-fit hover:bg-opacity-10 hover:bg-white hover:text-white"
                >
                  <a
                    href={`/seller/org/${fundraiser.organization.id}`}
                    className="text-xl md:text-[28px]"
                  >
                    <Users className="w-6 h-6 mr-2" />
                    <span>{fundraiser.organization.name}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem key="overview">
                <SidebarMenuButton
                  asChild
                  className="p-2 hover:bg-opacity-10 hover:bg-white hover:text-white"
                >
                  <a
                    href={`/seller/${fundraiser.id}`}
                    className="text-lg md:text-xl"
                  >
                    <House className="w-6 h-6 mr-2" />
                    <span>Overview</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem key="orders">
                <SidebarMenuButton
                  asChild
                  className="p-2 hover:bg-opacity-10 hover:bg-white hover:text-white"
                >
                  <a
                    href={`/seller/${fundraiser.id}/orders`}
                    className="text-lg md:text-xl"
                  >
                    <ShoppingBag className="w-6 h-6 mr-2" />
                    <span>Orders</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem key="analytics">
                <SidebarMenuButton
                  asChild
                  className="p-2 hover:bg-opacity-10 hover:bg-white hover:text-white"
                >
                  <a
                    href={`/seller/${fundraiser.id}/analytics`}
                    className="text-lg md:text-xl"
                  >
                    <ChartLine className="w-6 h-6 mr-2" />
                    <span>Analytics</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
