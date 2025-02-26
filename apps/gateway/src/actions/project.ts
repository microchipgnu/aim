'use server';

import {
  type CreateDocumentInput,
  type CreateProjectInput,
  type UpdateDocumentInput,
  type UpdateProjectNameInput,
  createDocument,
  createProject,
  deleteDocument,
  getProject,
  revertToVersion,
  updateDocument,
  updateProjectName,
} from '@/lib/projects';

export async function createProjectAction(input: CreateProjectInput) {
  return await createProject(input);
}

export async function createDocumentAction(input: CreateDocumentInput) {
  return await createDocument(input);
}

export async function updateDocumentAction(input: UpdateDocumentInput) {
  return await updateDocument(input);
}

export async function getProjectAction(projectId: string) {
  return await getProject(projectId);
}

export async function deleteDocumentAction(documentId: string) {
  return await deleteDocument(documentId);
}

export async function revertToVersionAction(
  documentId: string,
  versionId: string,
  userId: string,
) {
  return await revertToVersion(documentId, versionId, userId);
}

export async function updateProjectNameAction(input: UpdateProjectNameInput) {
  return await updateProjectName(input);
}
