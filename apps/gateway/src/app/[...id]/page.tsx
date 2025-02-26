import { SandboxModal } from '@/components/modals/sandbox-modal';
import { ProjectsSidebar } from '@/components/projects-sidebar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getProject } from '@/lib/projects';

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ id: string[] }>;
}) {
  const resolvedParams = await params;
  const currentRoute = resolvedParams.id.join('/');
  const projectId = currentRoute.split('/')[0];
  const route = currentRoute.split('/').slice(1).join('/');

  const project = await getProject(projectId);

  // Check if we're on the root project path
  const isProjectRoot = route === '';

  const routes = project.files.map((file) => ({
    path: `/${projectId}/${file.path}`,
    file: file.path.split('/').pop() || file.path,
  }));

  return (
    <div className="flex h-screen">
      <ProjectsSidebar
        backPath={{
          href: `/${project.id}`,
          title: project.name,
        }}
        routes={routes}
        projectId={projectId}
      >
        <main className="flex-1 overflow-auto">
          <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
            <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-none">
              <div className="container flex items-center justify-between h-14 px-4">
                <div className="flex items-center gap-4">
                  {!isProjectRoot && (
                    <SandboxModal
                      content={
                        project.files.find((file) => file.path === route)
                          ?.content || ''
                      }
                    />
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      <span className="text-muted-foreground">/projects/</span>
                      <span className="text-foreground font-semibold">
                        {project.name}
                      </span>
                      {route && (
                        <>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-foreground">{route}</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </nav>
            <div className="container flex-1 mx-auto px-4 flex flex-col overflow-hidden h-full">
              {isProjectRoot ? (
                // Dashboard/Stats View
                <>
                  <header className="h-[120px] flex flex-col justify-center flex-none">
                    <div className="max-w-3xl">
                      <h1 className="text-4xl font-bold tracking-tighter text-foreground">
                        {project.name}
                      </h1>
                      <p className="mt-2 text-lg text-muted-foreground leading-relaxed">
                        {project.description}
                      </p>
                    </div>
                  </header>
                </>
              ) : (
                // File View
                <div className="py-6">
                  <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-4 mb-4">
                      <h2 className="text-2xl font-semibold">
                        {route.split('/').pop()}
                      </h2>
                    </div>
                    {/* Add your file viewer component here */}

                    <div className="grid grid-cols-12 gap-8 flex-1 min-h-0 h-full">
                      <div className="col-span-12 lg:col-span-4">
                        <ScrollArea className="h-full">
                          <Card>
                            <CardHeader>
                              <CardTitle>Project Details</CardTitle>
                              <CardDescription>
                                Created 2 days ago
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="text-sm text-muted-foreground">
                                  <span className="font-medium text-foreground">
                                    3
                                  </span>{' '}
                                  APIs
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <span className="font-medium text-foreground">
                                    1.2k
                                  </span>{' '}
                                  Requests today
                                </div>
                                <Button className="w-full">
                                  Manage Project
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </ScrollArea>
                      </div>

                      <div className="col-span-12 lg:col-span-8 h-full">
                        <Tabs
                          defaultValue="overview"
                          className="h-full flex flex-col"
                        >
                          <TabsList className="w-full justify-start space-x-2 rounded-lg bg-muted p-1 flex-none">
                            <TabsTrigger value="overview" className="flex-1">
                              Overview
                            </TabsTrigger>
                            <TabsTrigger value="apis" className="flex-1">
                              APIs
                            </TabsTrigger>
                            <TabsTrigger value="analytics" className="flex-1">
                              Analytics
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="flex-1">
                              Settings
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent
                            value="overview"
                            className="mt-6 flex-1 min-h-0"
                          >
                            <ScrollArea className="h-full">
                              <Card>
                                <CardHeader>
                                  <CardTitle>Project Overview</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  Overview content will go here
                                </CardContent>
                              </Card>
                            </ScrollArea>
                          </TabsContent>

                          <TabsContent
                            value="apis"
                            className="mt-6 flex-1 min-h-0"
                          >
                            <ScrollArea className="h-full">
                              <Card>
                                <CardHeader>
                                  <CardTitle>APIs</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  APIs content will go here
                                </CardContent>
                              </Card>
                            </ScrollArea>
                          </TabsContent>

                          <TabsContent
                            value="analytics"
                            className="mt-6 flex-1 min-h-0"
                          >
                            <ScrollArea className="h-full">
                              <Card>
                                <CardHeader>
                                  <CardTitle>Analytics</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  Analytics content will go here
                                </CardContent>
                              </Card>
                            </ScrollArea>
                          </TabsContent>

                          <TabsContent
                            value="settings"
                            className="mt-6 flex-1 min-h-0"
                          >
                            <ScrollArea className="h-full">
                              <Card>
                                <CardHeader>
                                  <CardTitle>Settings</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  Settings content will go here
                                </CardContent>
                              </Card>
                            </ScrollArea>
                          </TabsContent>
                        </Tabs>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </ProjectsSidebar>
    </div>
  );
}
