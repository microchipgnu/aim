import { HomePage } from '@/components/home-page';
import { RouteView } from '@/components/route-view/route-view';
import { AppSidebar } from '@/components/sidebar';
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Maximize2, Minimize2 } from "lucide-react";
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Sandbox } from './components/sandbox';

function App() {
  const [routes, setRoutes] = React.useState<{ path: string; file: string }[]>([]);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    fetch('/api')
      .then(response => response.json())
      .then(data => setRoutes(data.routes))
      .catch(error => console.error('Error fetching routes:', error));
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/_aim_/sandbox' element={<Sandbox />} />
        <Route path="*" element={
          <SidebarProvider>
            <div className="flex h-screen w-full">
              {!isFullscreen && <AppSidebar routes={routes} />}
              <SidebarInset className="flex-1 overflow-auto">
                <Routes>
                  <Route path="/" element={<HomePage routes={routes} />} />
                  {routes.map((route, index) => (
                    <Route
                      key={index}
                      path={`/${route.path}/*`}
                      element={
                        <div className="relative">
                          <RouteView path={route.path} isFullscreen={isFullscreen} />
                          <Button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="absolute bottom-4 right-4 z-10"
                            variant="secondary"
                            size="sm"
                          >
                            {isFullscreen ? (
                              <>
                                <Minimize2 className="h-4 w-4 mr-2" />
                                Exit
                              </>
                            ) : (
                              <>
                                <Maximize2 className="h-4 w-4 mr-2" />
                                Expand
                              </>
                            )}
                          </Button>
                        </div>
                      }
                    />
                  ))}
                </Routes>
              </SidebarInset>
            </div>
          </SidebarProvider>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
