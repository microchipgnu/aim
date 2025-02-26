import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileCode, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface Route {
  path: string;
  file: string;
}

interface HomePageProps {
  routes: Route[];
}

export function HomePage({ routes }: HomePageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRoutes = routes.filter((route) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      route.path.toLowerCase().includes(searchTerm) ||
      route.file.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to AIM</h1>
        <p className="text-muted-foreground mt-2">
          Browse through your available prompts and examples below
        </p>
      </div>
      <div className="relative mb-6">
        <Input
          type="text"
          placeholder="Search prompts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoutes.map((route, index) => {
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
