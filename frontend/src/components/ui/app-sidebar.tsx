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
import { CircleUserRound } from "lucide-react";
import { redirect } from "next/navigation";
import { House, ChartLine, ShoppingBag } from "lucide-react";

type AppSidebarProps = React.HTMLAttributes<HTMLDivElement> & {
  org: string;
  icon?: string;
};

export async function AppSidebar({
  org,
  icon
}: AppSidebarProps) {
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
              <SidebarMenuItem key={org}>
                <SidebarMenuButton asChild className="p-2">
                <a href="" className="text-xl md:text-[28px]">
                  <div className="flex">
                    {icon!="" ? (
                      <img
                        src={icon}
                        alt="Organization Logo"
                        className="w-6 h-6 mr-2 rounded-full"
                      />
                    ) : (
                      <CircleUserRound className="w-6 h-6 mr-2" />
                    )}
                    {org}
                  </div>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem key={"overview"}>
                <SidebarMenuButton asChild className="p-2">
                  <a href="" className="text-lg md:text-xl">
                    <House className="w-6 h-6 mr-2" />
                    <span>Overview</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem key={"orders"}>
                <SidebarMenuButton asChild className="p-2">
                  <a href="" className="text-lg md:text-xl">
                    <ShoppingBag className="w-6 h-6 mr-2" />
                    <span>Orders</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem key={"analytics"}>
                <SidebarMenuButton asChild className="p-2">
                  <a href="" className="text-lg md:text-xl">
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
