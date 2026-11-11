import { Package2Icon } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthUser } from "@/modules/auth/auth.context";
import { APP_ROUTES } from "@/config/app.routes";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail } from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

export function PanelSidebar() {
  const user = useAuthUser();
  return <Sidebar collapsible="icon">
    <SidebarHeader>
      <SidebarMenu><SidebarMenuItem><SidebarMenuButton size="lg" asChild><Link to={APP_ROUTES.panel.root}>
        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"><Package2Icon className="size-4" /></div>
        <div className="grid flex-1 text-left text-sm leading-tight"><span className="truncate font-medium">Tap</span><span className="truncate text-xs text-muted-foreground">Administración</span></div>
      </Link></SidebarMenuButton></SidebarMenuItem></SidebarMenu>
    </SidebarHeader>
    <SidebarContent><NavMain /></SidebarContent>
    <SidebarFooter><NavUser user={{ name: user.name, email: user.email, avatar: user.photoUrl }} /></SidebarFooter>
    <SidebarRail />
  </Sidebar>;
}
