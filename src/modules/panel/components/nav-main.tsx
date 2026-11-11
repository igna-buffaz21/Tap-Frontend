import { ChevronRightIcon, PackageIcon } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { APP_ROUTES } from "@/config/app.routes";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar } from "@/components/ui/sidebar";

const items = [
  { title: "Productos", url: APP_ROUTES.panel.products },
  { title: "Categorías", url: APP_ROUTES.panel.categories },
];

export function NavMain() {
  const { pathname } = useLocation();
  const { setOpenMobile } = useSidebar();
  return <SidebarGroup><SidebarMenu><Collapsible asChild defaultOpen className="group/collapsible">
    <SidebarMenuItem>
      <CollapsibleTrigger asChild><SidebarMenuButton tooltip="Productos"><PackageIcon /><span>Productos</span><ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" /></SidebarMenuButton></CollapsibleTrigger>
      <CollapsibleContent><SidebarMenuSub>
        {items.map((item) => <SidebarMenuSubItem key={item.url}><SidebarMenuSubButton asChild isActive={pathname === item.url}><NavLink to={item.url} onClick={() => setOpenMobile(false)}>{item.title}</NavLink></SidebarMenuSubButton></SidebarMenuSubItem>)}
      </SidebarMenuSub></CollapsibleContent>
    </SidebarMenuItem>
  </Collapsible></SidebarMenu></SidebarGroup>;
}
