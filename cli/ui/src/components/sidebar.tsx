import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from "@/components/ui/sidebar";
import { FileCode, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface Route {
  path: string;
  file: string;
}

interface SidebarProps {
  routes: Route[];
}

export function AppSidebar({ routes }: SidebarProps) {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center p-4">
          <span className="text-lg font-bold">AIM</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === '/'}>
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  <span>Home</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {routes.map((route, index) => (
              <SidebarMenuItem key={index}>
                <SidebarMenuButton asChild isActive={location.pathname === `/${route.path}`}>
                  <Link to={`/${route.path}`}>
                    <FileCode className="w-4 h-4 mr-2" />
                    <span>{route.path.split('/').pop() || route.path}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 space-y-2">
          <Button asChild variant="outline" className="w-full">
            <a href="https://github.com/microchipgnu/aim" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <a href="https://aim.microchipgnu.pt" target="_blank" rel="noopener noreferrer">
              Documentation
            </a>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
