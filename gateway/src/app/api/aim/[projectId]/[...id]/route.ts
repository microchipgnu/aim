import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/projects";

export async function GET(
    request: NextRequest,
    { params }: { params: { projectId: string; id: string[] } }
) {
    try {
        const project = await getProject(params.projectId);
        const filePath = params.id.join("/");

        const file = project.files.find((f) => f.path === filePath);

        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        return NextResponse.json(file);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch file" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { projectId: string; id: string[] } }
) {
    try {
        const project = await getProject(params.projectId);
        const filePath = params.id.join("/");
        const body = await request.json();

        const fileIndex = project.files.findIndex((f) => f.path === filePath);

        if (fileIndex === -1) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        return NextResponse.json(project.files[fileIndex]);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to update file" },
            { status: 500 }
        );
    }
}
