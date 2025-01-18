import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppSidebar } from '@/components/sidebar';
import { HomePage } from '@/components/home-page';
import { RouteView } from '@/components/route-view';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

function App() {
  const [routes, setRoutes] = React.useState<{ path: string; file: string }[]>([]);

  React.useEffect(() => {
    fetch('/api')
      .then(response => response.json())
      .then(data => setRoutes(data.routes))
      .catch(error => console.error('Error fetching routes:', error));
  }, []);

  return (
    <BrowserRouter>
      <SidebarProvider>
        <div className="flex h-screen">
          <AppSidebar routes={routes} />
          <SidebarInset className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<HomePage routes={routes} />} />
              {routes.map((route, index) => (
                <Route
                  key={index}
                  path={`/${route.path}/*`}
                  element={<RouteView path={route.path} />}
                />
              ))}
            </Routes>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </BrowserRouter>
  );
}

export default App;

