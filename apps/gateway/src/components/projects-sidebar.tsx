'use client';

import { createDocumentAction } from '@/actions/project';
import { AuthModal } from '@/components/modals/auth-modal';
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
  SidebarProvider,
} from '@/components/ui/sidebar';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronRight,
  FileCode,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { nanoid } from 'nanoid';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

interface Route {
  path: string;
  file: string;
}

interface SidebarProps {
  backPath?: {
    href: string;
    title: string;
  };
  children?: React.ReactNode;
  routes: Route[];
  projectId: string;
}

interface FolderContent {
  files: Route[];
  folders: { [key: string]: FolderContent };
}

interface FolderStructure {
  [key: string]: FolderContent;
}

export function ProjectsSidebar({
  backPath,
  children,
  routes,
  projectId,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
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
    const structure: FolderStructure = {};

    routes.forEach((route) => {
      const parts = route.path.split('/').filter(Boolean);
      let current = structure;

      // Handle all parts except the last one (which is the file)
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (i === 0) continue; // Skip the project name

        if (!current[part]) {
          current[part] = {
            files: [],
            folders: {},
          };
        }
        current = current[part].folders;
      }

      // Handle the file
      const fileName = parts[parts.length - 1];
      if (!current[fileName]) {
        current[fileName] = {
          files: [],
          folders: {},
        };
      }
      current[fileName].files.push({
        path: route.path,
        file: fileName,
      });
    });

    return structure;
  }, [routes]);

  const handleNavigation = (
    e: React.MouseEvent<HTMLAnchorElement>,
    path: string,
  ) => {
    e.preventDefault();
    router.push(path);
  };

  const handleCreateFile = async () => {
    try {
      await createDocumentAction({
        projectId: projectId,
        path: nanoid() + '.md',
        content: 'Hello, world! ❌',
        userId: await authClient
          .getSession()
          .then((session) => session?.data?.user?.id || ''),
      });
      // Refresh your routes or handle success
    } catch (error) {
      console.error('Failed to create file:', error);
      // Handle error
    }
  };

  const renderFolderContent = (structure: FolderStructure, basePath = '') => {
    return Object.entries(structure).map(([name, content]) => {
      const currentPath = `${basePath}/${name}`;
      const isExpanded = expandedFolders.has(currentPath);

      if (content.files.length > 0) {
        return (
          <SidebarMenuItem key={currentPath}>
            <SidebarMenuButton
              asChild
              isActive={pathname === content.files[0].path}
            >
              <Link
                href={content.files[0].path}
                onClick={(e) => handleNavigation(e, content.files[0].path)}
                className={cn(
                  'flex w-full items-center py-2 px-3',
                  'text-sm font-medium',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus-visible:outline-none focus-visible:ring-1',
                  'focus-visible:ring-ring rounded-md',
                )}
              >
                <FileCode className="h-4 w-4 shrink-0 mr-2 text-muted-foreground" />
                <span>{name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      }

      return (
        <SidebarMenuItem key={currentPath}>
          <SidebarMenuButton onClick={() => toggleFolder(currentPath)}>
            <div
              className={cn(
                'flex w-full items-center py-2 px-3',
                'text-sm font-medium',
                'hover:bg-accent hover:text-accent-foreground',
                'focus-visible:outline-none focus-visible:ring-1',
                'focus-visible:ring-ring rounded-md',
              )}
            >
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 shrink-0 mr-2 text-muted-foreground" />
              ) : (
                <Folder className="h-4 w-4 shrink-0 mr-2 text-muted-foreground" />
              )}
              <span>{name}</span>
              {isExpanded ? (
                <ChevronDown className="ml-auto h-4 w-4" />
              ) : (
                <ChevronRight className="ml-auto h-4 w-4" />
              )}
            </div>
          </SidebarMenuButton>
          {isExpanded && (
            <SidebarMenu className="ml-4">
              {renderFolderContent(content.folders, currentPath)}
            </SidebarMenu>
          )}
        </SidebarMenuItem>
      );
    });
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b">
          <div className="flex h-12 divide-x">
            <Link
              href="/"
              className="flex items-center px-6 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 text-foreground">
                <span className="text-lg font-semibold tracking-tight">
                  AIM
                </span>
              </div>
            </Link>
            {backPath && (
              <Link
                href={backPath.href}
                className="flex items-center px-6 hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-center gap-3 text-foreground">
                  <span className="text-sm font-medium">{backPath.title}</span>
                </div>
              </Link>
            )}
          </div>
        </SidebarHeader>
        <SidebarContent>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <SidebarMenu>{renderFolderContent(folderStructure)}</SidebarMenu>
          </ScrollArea>
        </SidebarContent>
        <SidebarFooter className="border-t p-4">
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleCreateFile}
            >
              <FileCode className="mr-2 h-4 w-4" />
              Create File
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <a
                href="https://github.com/microchipgnu/aim"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <a
                href="https://aim.microchipgnu.pt"
                target="_blank"
                rel="noopener noreferrer"
              >
                Documentation
              </a>
            </Button>
            <AuthModal />
          </div>
        </SidebarFooter>
      </Sidebar>
      {children}
    </SidebarProvider>
  );
}
