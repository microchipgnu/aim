import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCode } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Route {
  path: string;
  file: string;
}

interface HomePageProps {
  routes: Route[];
}

export function HomePage({ routes }: HomePageProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {routes.map((route, index) => {
          const displayName = route.path.split('/').pop() || route.path;
          const directory = route.file.split('/').slice(0, -1).join('/');
          return (
            <Link key={index} to={`/${route.path}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {displayName}
                  </CardTitle>
                  <FileCode className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{directory}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

