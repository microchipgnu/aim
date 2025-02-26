import crypto from 'crypto';
import { db } from '@/db';
import {
  documentVersions,
  documents,
  projects,
  versionTags,
} from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export interface CreateProjectInput {
  name: string;
  description?: string;
  userId: string;
  isPrivate?: boolean;
  documents: Array<{
    path: string;
    content: string;
  }>;
}

export interface CreateDocumentInput {
  projectId: string;
  path: string;
  content: string;
  userId: string;
}

export interface UpdateDocumentInput {
  documentId: string;
  content: string;
  message?: string;
  userId: string;
}

export interface UpdateDocumentPathInput {
  documentId: string;
  newPath: string;
  userId: string;
  message?: string;
}

export interface UpdateProjectNameInput {
  projectId: string;
  name: string;
  userId: string;
}

// Helper: Calculate hash of content
function calculateHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Helper: Calculate project hash from all document hashes
async function calculateProjectHash(projectId: string): Promise<string> {
  const docs = await db
    .select({ contentHash: documents.contentHash })
    .from(documents)
    .where(eq(documents.projectId, projectId));

  const combinedHash = docs
    .map((d) => d.contentHash)
    .sort()
    .join('');

  return calculateHash(combinedHash);
}

// Get a project and all its latest documents
export async function getProject(projectId: string) {
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!project) throw new Error('Project not found');

  const projectDocs = await db
    .select({
      id: documents.id,
      path: documents.path,
      content: documents.content,
      contentHash: documents.contentHash,
      createdAt: documents.createdAt,
      updatedAt: documents.updatedAt,
    })
    .from(documents)
    .where(eq(documents.projectId, projectId));

  return {
    ...project,
    files: projectDocs,
  };
}

// Create a new project with initial documents
export async function createProject(input: CreateProjectInput) {
  return await db.transaction(async (tx) => {
    // Create project
    const project = await tx
      .insert(projects)
      .values({
        id: nanoid(),
        name: input.name,
        description: input.description,
        userId: input.userId,
        contentHash: '', // Temporary, will update after documents are created
        isPrivate: input.isPrivate ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()
      .then((rows) => rows[0]);

    // Create initial documents
    for (const doc of input.documents) {
      const document = await tx
        .insert(documents)
        .values({
          id: nanoid(),
          projectId: project.id,
          path: doc.path,
          content: doc.content,
          contentHash: calculateHash(doc.content),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()
        .then((rows) => rows[0]);

      // Create initial version
      const version = await tx
        .insert(documentVersions)
        .values({
          id: nanoid(),
          documentId: document.id,
          content: doc.content,
          contentHash: calculateHash(doc.content),
          version: 1,
          message: 'Initial commit',
          createdBy: input.userId,
          createdAt: new Date(),
        })
        .returning()
        .then((rows) => rows[0]);

      // Update document with initial version
      await tx
        .update(documents)
        .set({ currentVersionId: version.id })
        .where(eq(documents.id, document.id));
    }

    // Update project hash
    const finalHash = await calculateProjectHash(project.id);
    await tx
      .update(projects)
      .set({ contentHash: finalHash })
      .where(eq(projects.id, project.id));

    return project;
  });
}

// Create a new document in an existing project
export async function createDocument(input: CreateDocumentInput) {
  return await db.transaction(async (tx) => {
    // Create document
    const document = await tx
      .insert(documents)
      .values({
        id: nanoid(),
        projectId: input.projectId,
        path: input.path,
        content: input.content,
        contentHash: calculateHash(input.content),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()
      .then((rows) => rows[0]);

    // Create initial version
    const version = await tx
      .insert(documentVersions)
      .values({
        id: nanoid(),
        documentId: document.id,
        content: input.content,
        contentHash: calculateHash(input.content),
        version: 1,
        message: 'Initial commit',
        createdBy: input.userId,
        createdAt: new Date(),
      })
      .returning()
      .then((rows) => rows[0]);

    // Update document with initial version
    await tx
      .update(documents)
      .set({ currentVersionId: version.id })
      .where(eq(documents.id, document.id));

    // Update project hash
    const newProjectHash = await calculateProjectHash(input.projectId);
    await tx
      .update(projects)
      .set({
        contentHash: newProjectHash,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, input.projectId));

    return document;
  });
}

// Update a document with version history
export async function updateDocument(input: UpdateDocumentInput) {
  return await db.transaction(async (tx) => {
    // Get current document and version
    const document = await tx
      .select()
      .from(documents)
      .where(eq(documents.id, input.documentId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!document) throw new Error('Document not found');

    const currentVersion = document.currentVersionId
      ? await tx
          .select()
          .from(documentVersions)
          .where(eq(documentVersions.id, document.currentVersionId))
          .limit(1)
          .then((rows) => rows[0])
      : null;

    // Create new version
    const newVersion = await tx
      .insert(documentVersions)
      .values({
        id: nanoid(),
        documentId: document.id,
        content: input.content,
        contentHash: calculateHash(input.content),
        version: (currentVersion?.version ?? 0) + 1,
        message: input.message,
        createdBy: input.userId,
        createdAt: new Date(),
      })
      .returning()
      .then((rows) => rows[0]);

    // Update document
    await tx
      .update(documents)
      .set({
        content: input.content,
        contentHash: calculateHash(input.content),
        currentVersionId: newVersion.id,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, input.documentId));

    // Update project hash
    const newProjectHash = await calculateProjectHash(document.projectId);
    await tx
      .update(projects)
      .set({
        contentHash: newProjectHash,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, document.projectId));

    return newVersion;
  });
}

// Delete a document and all its versions
export async function deleteDocument(documentId: string) {
  return await db.transaction(async (tx) => {
    // Get document to find project ID
    const document = await tx
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!document) throw new Error('Document not found');

    // Delete all version tags associated with the document's versions
    await tx.delete(versionTags).where(eq(versionTags.versionId, documentId));

    // Delete all versions of the document
    await tx
      .delete(documentVersions)
      .where(eq(documentVersions.documentId, documentId));

    // Delete the document itself
    await tx.delete(documents).where(eq(documents.id, documentId));

    // Update project hash
    const newProjectHash = await calculateProjectHash(document.projectId);
    await tx
      .update(projects)
      .set({
        contentHash: newProjectHash,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, document.projectId));

    return document;
  });
}

// Revert document to specific version
export async function revertToVersion(
  documentId: string,
  versionId: string,
  userId: string,
) {
  return await db.transaction(async (tx) => {
    const oldVersion = await tx
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.id, versionId))
      .limit(1)
      .then((rows) => rows[0]);
    if (!oldVersion) throw new Error('Version not found');

    const document = await tx
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1)
      .then((rows) => rows[0]);
    if (!document) throw new Error('Document not found');

    const currentVersion = document.currentVersionId
      ? await tx
          .select()
          .from(documentVersions)
          .where(eq(documentVersions.id, document.currentVersionId))
          .limit(1)
          .then((rows) => rows[0])
      : null;

    // Create revert version
    const revertVersion = await tx
      .insert(documentVersions)
      .values({
        id: nanoid(),
        documentId: document.id,
        content: oldVersion.content,
        contentHash: oldVersion.contentHash,
        version: (currentVersion?.version ?? 0) + 1,
        message: `Reverted to version ${oldVersion.version}`,
        createdBy: userId,
        createdAt: new Date(),
      })
      .returning()
      .then((rows) => rows[0]);

    // Update document
    await tx
      .update(documents)
      .set({
        content: oldVersion.content,
        contentHash: oldVersion.contentHash,
        currentVersionId: revertVersion.id,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId));

    return revertVersion;
  });
}

// Create a version tag
export async function createVersionTag(
  name: string,
  versionId: string,
  userId: string,
) {
  const version = await db
    .select({
      documentId: documentVersions.documentId,
    })
    .from(documentVersions)
    .where(eq(documentVersions.id, versionId))
    .limit(1)
    .then((rows) => rows[0]);
  if (!version) throw new Error('Version not found');

  const document = await db
    .select({
      projectId: documents.projectId,
    })
    .from(documents)
    .where(eq(documents.id, version.documentId))
    .limit(1)
    .then((rows) => rows[0]);
  if (!document) throw new Error('Document not found');

  return await db
    .insert(versionTags)
    .values({
      id: nanoid(),
      name,
      versionId,
      projectId: document.projectId,
      createdBy: userId,
      createdAt: new Date(),
    })
    .returning()
    .then((rows) => rows[0]);
}

// Get document history
export async function getDocumentHistory(documentId: string) {
  return await db
    .select()
    .from(documentVersions)
    .where(eq(documentVersions.documentId, documentId))
    .orderBy(desc(documentVersions.version))
    .leftJoin(versionTags, eq(versionTags.versionId, documentVersions.id));
}

// Update a document's path/filename
export async function updateDocumentPath(input: UpdateDocumentPathInput) {
  return await db.transaction(async (tx) => {
    // Get current document
    const document = await tx
      .select()
      .from(documents)
      .where(eq(documents.id, input.documentId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!document) throw new Error('Document not found');

    // Update document path
    await tx
      .update(documents)
      .set({
        path: input.newPath,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, input.documentId));

    // Create a version entry to track the path change
    const currentVersion = document.currentVersionId
      ? await tx
          .select()
          .from(documentVersions)
          .where(eq(documentVersions.id, document.currentVersionId))
          .limit(1)
          .then((rows) => rows[0])
      : null;

    const newVersion = await tx
      .insert(documentVersions)
      .values({
        id: nanoid(),
        documentId: document.id,
        content: document.content, // Keep the same content
        contentHash: document.contentHash,
        version: (currentVersion?.version ?? 0) + 1,
        message:
          input.message ?? `Renamed from ${document.path} to ${input.newPath}`,
        createdBy: input.userId,
        createdAt: new Date(),
      })
      .returning()
      .then((rows) => rows[0]);

    // Update document's current version
    await tx
      .update(documents)
      .set({ currentVersionId: newVersion.id })
      .where(eq(documents.id, input.documentId));

    return {
      ...document,
      path: input.newPath,
    };
  });
}

// Update a project's name
export async function updateProjectName(input: UpdateProjectNameInput) {
  return await db.transaction(async (tx) => {
    // Get current project
    const project = await tx
      .select()
      .from(projects)
      .where(eq(projects.id, input.projectId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!project) throw new Error('Project not found');

    // Update project name
    await tx
      .update(projects)
      .set({
        name: input.name,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, input.projectId));

    return {
      ...project,
      name: input.name,
    };
  });
}
