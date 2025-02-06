"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "../ui/input";
import { useAuth } from "@/providers/auth-provider";
import { useState } from "react";
import { toast } from "sonner";
import { createProjectAction } from "@/actions/project";
import { authClient } from "@/lib/auth-client";

export function CreateProjectModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const { apiKeys } = useAuth();

    const handleSubmit = async () => {
        if (!name) {
            toast.error("Please enter a project name");
            return;
        }

        const session = await authClient.getSession();

        if (!session || !session.data) {
            toast.error("Please sign in to create a project");
            return;
        }

        await createProjectAction({
            name,
            description: "",
            userId: session.data.user.id,
            isPrivate: false,
            documents: []
        })

        toast.success("Project created successfully");
        setName("");
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    Create Project
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Project Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter project name"
                        />
                    </div>
                    <Button
                        onClick={handleSubmit}
                        disabled={!name}
                    >
                        Create Project
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
