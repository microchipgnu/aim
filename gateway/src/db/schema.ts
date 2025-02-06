import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: text("id").primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').notNull(),
    image: text('image'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull()
});

export const sessions = pgTable("sessions", {
    id: text("id").primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id').notNull().references(() => users.id)
});

export const accounts = pgTable("accounts", {
    id: text("id").primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id').notNull().references(() => users.id),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull()
});

export const verifications = pgTable("verifications", {
    id: text("id").primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at'),
    updatedAt: timestamp('updated_at')
});

export const apiKeys = pgTable("api_keys", {
    id: text("id").primaryKey(),
    name: text('name').notNull(),
    key: text('key').notNull().unique(),
    userId: text('user_id').notNull().references(() => users.id),
    expiresAt: timestamp('expires_at'),
    lastUsedAt: timestamp('last_used_at'),
    usageCount: integer('usage_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull()
});

export const projects = pgTable("projects", {
    id: text("id").primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    userId: text('user_id').notNull().references(() => users.id),
    contentHash: text('content_hash').notNull(), // SHA hash of all documents
    isPrivate: boolean('is_private').notNull().default(true),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull()
});

export const documents = pgTable("documents", {
    id: text("id").primaryKey(),
    projectId: text('project_id').notNull().references(() => projects.id),
    path: text('path').notNull(), // File path within project
    content: text('content').notNull(), // Raw markdown content
    contentHash: text('content_hash').notNull(), // SHA hash of content
    currentVersionId: text('current_version_id'), // References latest version
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull()
});

export const documentVersions = pgTable("document_versions", {
    id: text("id").primaryKey(),
    documentId: text('document_id').notNull().references(() => documents.id),
    content: text('content').notNull(), // Content at this version
    contentHash: text('content_hash').notNull(), // SHA hash of this version
    version: integer('version').notNull(), // Sequential version number
    message: text('message'), // Optional commit message
    createdBy: text('created_by').references(() => users.id),
    createdAt: timestamp('created_at').notNull()
});

export const versionTags = pgTable("version_tags", {
    id: text("id").primaryKey(),
    name: text('name').notNull(), // e.g., "v1.0.0", "stable"
    versionId: text('version_id').notNull().references(() => documentVersions.id),
    projectId: text('project_id').notNull().references(() => projects.id),
    createdBy: text('created_by').references(() => users.id),
    createdAt: timestamp('created_at').notNull()
});

// Project collaborators
export const projectMembers = pgTable("project_members", {
    id: text("id").primaryKey(),
    projectId: text('project_id').notNull().references(() => projects.id),
    userId: text('user_id').notNull().references(() => users.id),
    role: text('role').notNull(), // e.g., 'owner', 'editor', 'viewer'
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull()
});

export const schema = {
    users,
    sessions,
    accounts,
    verifications,
    apiKeys,
    projects,
    documents,
    documentVersions,
    versionTags,
    projectMembers
};
