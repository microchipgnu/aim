import { db } from '@/db';
import { apiKeys, projects } from '@/db/schema';
import { createProject } from '@/lib/projects';
import { eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        console.log('GET /api/project - Starting request');

        // Get project name from query params
        const projectName = request.nextUrl.searchParams.get('id');
        console.log('Project name from query:', projectName);

        if (!projectName) {
            console.log('No project name provided');
            return NextResponse.json(
                { error: 'Project name is required' },
                { status: 400 }
            );
        }

        // Get API key from database
        console.log('Fetching API key from database');
        const apiKey = await db
            .select({ key: apiKeys.key })
            .from(apiKeys)
            .limit(1)
            .then(rows => rows[0]);

        if (!apiKey) {
            console.log('No API key found in database');
            return NextResponse.json(
                { error: 'No API key found' },
                { status: 401 }
            );
        }

        const authHeader = `Bearer ${apiKey.key}`;
        console.log('Generated auth header with API key');

        // Check if project exists and get its files from storage
        console.log('Checking if project exists:', projectName);
        const project = await db
            .select({ id: projects.id })
            .from(projects)
            .where(eq(projects.name, projectName))
            .limit(1)
            .then(rows => rows[0]);

        if (!project) {
            console.log('Project not found:', projectName);
            return NextResponse.json({ exists: false });
        }

        // Get project files from storage
        console.log('Fetching project files from storage for project:', project.id);
        const contents = await fetch(`${process.env.NEXT_PUBLIC_INFERENCE_URL}/storage/list/${project.id}`, {
            headers: {
                'Authorization': authHeader
            }
        }).then(res => res.json());
        console.log('Retrieved files:', contents.length, 'files');

        return NextResponse.json({
            exists: true,
            files: contents
        });

    } catch (error) {
        console.error('Error checking project:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('POST /api/project - Starting request');

        // Verify authentication
        const authHeader = request.headers.get('authorization');
        console.log('Auth header present:', !!authHeader);

        if (!authHeader) {
            return NextResponse.json(
                { error: 'Authorization header missing' },
                { status: 401 }
            );
        }

        // Extract API key from Authorization header
        const apiKey = authHeader.replace('Bearer ', '');
        console.log('Extracted API key from header');

        // Verify API key exists and is valid
        console.log('Verifying API key');
        const keyRecord = await db
            .select({
                userId: apiKeys.userId,
                expiresAt: apiKeys.expiresAt
            })
            .from(apiKeys)
            .where(eq(apiKeys.key, apiKey))
            .limit(1)
            .then(rows => rows[0]);

        if (!keyRecord) {
            console.log('Invalid API key');
            return NextResponse.json(
                { error: 'Invalid API key' },
                { status: 401 }
            );
        }

        // Check if API key is expired
        if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
            console.log('API key expired:', keyRecord.expiresAt);
            return NextResponse.json(
                { error: 'API key has expired' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { name, description, isPrivate, } = body;
        console.log('Request body:', { name, description, isPrivate });

        // Validate required fields
        if (!name) {
            console.log('Missing required fields');
            return NextResponse.json(
                { error: 'Project name and files are required' },
                { status: 400 }
            );
        }

        // Check if project name already exists for this user
        console.log('Checking for existing project with name:', name);
        const existingProject = await db
            .select()
            .from(projects)
            .where(eq(projects.name, name))
            .limit(1)
            .then(rows => rows[0]);

        if (existingProject) {
            console.log('Project name already exists');
            return NextResponse.json(
                { error: 'Project name already exists' },
                { status: 409 }
            );
        }

        // Create new project using projects.ts helper
        console.log('Creating new project');
        const newProject = await createProject({
            name,
            description,
            userId: keyRecord.userId,
            isPrivate,
            documents: [{
                content: "# Hello World",
                path: "README.md"
            }]
        });
        console.log('Created project:', newProject);

        // Update API key usage
        console.log('Updating API key usage stats');
        await db
            .update(apiKeys)
            .set({
                lastUsedAt: new Date(),
                usageCount: sql`${apiKeys.usageCount} + 1`
            })
            .where(eq(apiKeys.key, apiKey));

        return NextResponse.json(newProject, { status: 201 });

    } catch (error) {
        console.error('Error creating project:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
