"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/providers/auth-provider";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "../ui/input";

interface FileWithPath extends File {
    webkitRelativePath: string;
}

export function CreateProjectWithFilesModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [files, setFiles] = useState<FileList | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { apiKeys } = useAuth();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log("File select event:", e.target.files);
        if (e.target.files && e.target.files.length > 0) {
            setFiles(e.target.files);
            console.log("Files selected:", Array.from(e.target.files).map(f => ({
                name: f.name,
                path: (f as FileWithPath).webkitRelativePath,
                size: f.size
            })));
        }
    };

    const handleSubmit = async () => {
        if (!files || files.length === 0) {
            toast.error("Please select files to upload");
            return;
        }

        try {
            const formData = new FormData();

            Array.from(files).forEach((file) => {
                console.log("Processing file:", {
                    name: file.name,
                    path: (file as FileWithPath).webkitRelativePath,
                    size: file.size
                });

                formData.append("files", file);
                formData.append("relativePath", (file as FileWithPath).webkitRelativePath || file.name);
            });

            console.log("Sending request to:", `${process.env.NEXT_PUBLIC_INFERENCE_URL}/storage/upload`);
            console.log("With auth token:", apiKeys[0].key.substring(0, 10) + "...");

            const response = await fetch(`${process.env.NEXT_PUBLIC_INFERENCE_URL}/storage/upload`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKeys[0].key}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: ${response.status} ${response.statusText}\n${errorText}`);
            }

            const result = await response.json();
            console.log("Upload successful:", result);
            toast.success("Project uploaded successfully");

            setFiles(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            setIsOpen(false);
        } catch (error) {
            console.error("Error uploading project:", error);
            toast.error(error instanceof Error ? error.message : "Error uploading project");
        }
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
                        <Label htmlFor="files">Project Files</Label>
                        <Input
                            id="files"
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            webkitdirectory=""
                            directory=""
                        />
                        <p className="text-sm text-muted-foreground">
                            Select a folder to upload all its contents
                        </p>
                    </div>
                    <Button
                        onClick={handleSubmit}
                        disabled={!files || files.length === 0}
                    >
                        Upload Project
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
