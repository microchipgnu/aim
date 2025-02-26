import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/clerk-react';
import {
  ChevronDown,
  ChevronRight,
  FileCode,
  Folder,
  FolderOpen,
  Home,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface Route {
  path: string;
  file: string;
}

interface SidebarProps {
  routes: Route[];
}

interface FolderContent {
  files: Route[];
  folders: { [key: string]: FolderContent };
}

interface FolderStructure {
  [key: string]: FolderContent;
}

export function AppSidebar({ routes }: SidebarProps) {
  const location = useLocation();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['/']),
  );

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  const folderStructure = useMemo(() => {
    const structure: FolderStructure = {
      '/': {
        files: [],
        folders: {},
      },
    };

    routes.forEach((route) => {
      const parts = route.path.split('/');
      let currentLevel = structure['/'];

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // This is a file
          currentLevel.files.push(route);
        } else {
          // This is a folder
          if (!currentLevel.folders[part]) {
            currentLevel.folders[part] = {
              files: [],
              folders: {},
            };
          }
          currentLevel = currentLevel.folders[part];
        }
      });
    });

    return structure;
  }, [routes]);

  const renderFolder = (structure: FolderStructure, path = '') => {
    return Object.entries(structure).map(([folderName, content]) => {
      const fullPath = path ? `${path}/${folderName}` : folderName;
      const isExpanded = expandedFolders.has(fullPath);
      const hasSubContent =
        content.files.length > 0 || Object.keys(content.folders).length > 0;

      return (
        <div key={folderName}>
          {folderName !== '/' && (
            <SidebarMenuItem>
              <div
                className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                onClick={() => hasSubContent && toggleFolder(fullPath)}
              >
                {hasSubContent &&
                  (isExpanded ? (
                    <ChevronDown className="w-4 h-4 mr-1" />
                  ) : (
                    <ChevronRight className="w-4 h-4 mr-1" />
                  ))}
                {content.folders && Object.keys(content.folders).length > 0 ? (
                  <FolderOpen className="w-4 h-4 mr-2" />
                ) : (
                  <Folder className="w-4 h-4 mr-2" />
                )}
                <span>{folderName}</span>
              </div>
            </SidebarMenuItem>
          )}
          {isExpanded && (
            <div className="ml-4">
              {content.files.map((route, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === `/${route.path}`}
                  >
                    <Link to={`/${route.path}`}>
                      <FileCode className="w-4 h-4 mr-2" />
                      <span>{route.path.split('/').pop() || route.path}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {Object.entries(content.folders).map(([subFolder, subContent]) =>
                renderFolder({ [subFolder]: subContent }, fullPath),
              )}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between p-4">
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
            {renderFolder(folderStructure)}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 space-y-2">
          <Button asChild variant="outline" className="w-full">
            <a
              href="https://github.com/microchipgnu/aim"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <a
              href="https://aim.microchipgnu.pt"
              target="_blank"
              rel="noopener noreferrer"
            >
              Documentation
            </a>
          </Button>
          <SignedOut>
            <SignInButton />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full">
                <User className="h-4 w-4 mr-2" />
                <span>Account</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
            </DropdownMenuContent>
          </DropdownMenu> */}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
