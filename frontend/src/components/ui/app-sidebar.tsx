
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
  
  export async function AppSidebar() {
    const supabase = createClient(); 
    const {
      data: { user },
      error: error1
    } = await (await supabase).auth.getUser();
    if (error1 || !user) {
        redirect("/login");
      }
  
    const items = [
      {
        title: "Home",
        url: "#",
      },
      {
        title: "Analytics",
        url: "#",
      },
    ];
  
    return (
      <Sidebar className="h-screen flex flex-col items-center justify-center">
        <div className="flex p-2">
          <CircleUserRound className="w-6 h-6 mr-2" /> 
          {user?.email?.split("@")[0]}
        </div>
        <SidebarContent className="flex flex-col items-center mt-[25vh] h-full">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="gap-10">
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="p-8">
                      <a href={item.url} className="text-lg md:text-xl">
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    );
  }
  