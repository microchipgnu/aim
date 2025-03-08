import { getProject } from '@/lib/projects';
import { type NextRequest, NextResponse } from 'next/server';

type Params = {
  projectId: string;
  id: string[];
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  try {
    const project = await getProject((await params).projectId);
    const filePath = (await params).id.join('/');

    const file = project.files.find((f) => f.path === filePath);

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    return NextResponse.json(file);
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  const body = await request.json();
  console.log(body);
  try {
    const project = await getProject((await params).projectId);
    const filePath = (await params).id.join('/');

    const fileIndex = project.files.findIndex((f) => f.path === filePath);

    if (fileIndex === -1) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    return NextResponse.json(project.files[fileIndex]);
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
