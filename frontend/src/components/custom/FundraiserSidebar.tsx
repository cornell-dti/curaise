import { BarChart2, FileText, Home, ShoppingCart } from "lucide-react";
import Link from "next/link";


/** TODO: DELETE AND REPLACE WITH CHELSEA'S SIDEBAR */
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function  FundraiserSidebar({ fundraiserId }: { fundraiserId: string }) {
  const items = [
    {
      title: "Fundraiser Overview",
      url: `/seller/fundraiser/${fundraiserId}`,
      icon: Home,
    },
    {
      title: "Analytics",
      url: `/seller/fundraiser/${fundraiserId}/analytics`,
      icon: BarChart2,
    },
    {
      title: "Orders",
      url: `/seller/fundraiser/${fundraiserId}/orders`,
      icon: ShoppingCart,
    },
    {
      title: "Edit Form",
      url: `/seller/fundraiser/${fundraiserId}/edit-form`,
      icon: FileText,
    },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>XXX Fundraiser Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
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
