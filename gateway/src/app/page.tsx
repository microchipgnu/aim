import { AuthModal } from "@/components/modals/auth-modal";
import { CreateProjectModal } from "@/components/modals/create-project";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { BrainCircuitIcon, RocketIcon, SearchIcon } from "lucide-react";
import Link from "next/link";

export default async function HomePage() {
  const userProjects = await db.select().from(projects).where(eq(projects.isPrivate, false)).orderBy(desc(projects.createdAt));

  return (
    <div className="flex min-h-screen flex-col bg-background w-full">
      <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50 w-full">
        <div className="flex h-16 items-center justify-between px-4 md:px-6 w-full">
          <div className="flex items-center space-x-4">
            <Link href="/" className="font-bold text-xl hover:text-primary transition-colors">
              AIM
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="/sandbox" className="font-medium hover:text-primary transition-colors">
              Sandbox
            </Link>
            <AuthModal />
          </div>
        </div>
      </nav>

      <main className="flex-1 px-4 md:px-6 py-16 flex flex-col">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight sm:text-6xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Your AI Gateway
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Manage and monitor your AI-powered projects. Create new projects, track performance, and configure settings all in one place.
          </p>
        </div>

        <div className="mx-auto max-w-7xl w-full">
          <div className="flex flex-col md:flex-row gap-4 mb-8 w-full">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="w-full pl-10"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="newest">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="activity">Most Active</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {userProjects.map((project) => (
              <Link href={`/${project.id}`} key={project.id}>
                <Card className="group hover:shadow-lg transition-all duration-300 h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <BrainCircuitIcon className="w-5 h-5 text-primary" />
                        </div>
                        <CardTitle className="group-hover:text-primary transition-colors">
                          {project.name}
                        </CardTitle>
                      </div>
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                    <CardDescription className="mt-2">{project.description || "No description provided"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4 bg-muted/50 rounded-lg p-3">
                      <span className="text-sm font-medium">
                        Created: {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-sm font-medium text-primary">
                        {project.isPrivate ? "Private" : "Public"}
                      </span>
                    </div>
                    <Button variant="outline" className="w-full hover:bg-primary hover:text-primary-foreground transition-all group-hover:border-primary">
                      View Project
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}

            <Card className="group hover:shadow-lg transition-all duration-300 border-dashed hover:border-primary h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <RocketIcon className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">Create a new project</CardTitle>
                </div>
                <CardDescription className="mt-2">Get started with a new AI project</CardDescription>
              </CardHeader>
              <CardContent>
                <CreateProjectModal />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
