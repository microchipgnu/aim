import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';
import multer from 'multer';
import * as storage from '../utils/storage';
import crypto from 'crypto';
import { nanoid } from 'nanoid';

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    }
});

export const uploadFiles = upload.array('files');

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('Starting file upload process');
        // Ensure multer middleware is applied before accessing files
        if (!req.files) {
            console.log('No files found in request, applying multer middleware');
            await new Promise((resolve, reject) => {
                uploadFiles(req, res, (err) => {
                    if (err) reject(err);
                    resolve(null);
                });
            });
        }

        const files = req.files as Express.Multer.File[];
        console.log('Request body:', req.body);
        console.log('Files:', files?.map(f => ({
            name: f.originalname,
            size: f.size,
            mimetype: f.mimetype
        })));

        if (!files || files.length === 0) {
            console.log('No files found after middleware');
            throw new AppError(400, 'No files uploaded');
        }

        // Filter out directories and invalid files
        const validFiles = files.filter(file => {
            // Check if file has actual content and isn't a directory
            return file.buffer.length > 0 && file.mimetype !== 'application/octet-stream';
        });

        if (validFiles.length === 0) {
            throw new AppError(400, 'No valid files found - directories cannot be uploaded directly');
        }

        console.log('Generating project hash from file contents');
        const hash = crypto.createHash('sha256');
        for (const file of validFiles) {
            hash.update(file.buffer);
        }
        const contentHash = hash.digest('hex');
        const projectName = nanoid();
        console.log('Generated project name:', projectName);

        console.log('Uploading files to storage');
        const results = await Promise.all(validFiles.map(async (file) => {
            const relativePath = file.originalname;
            const prefix = `${projectName}`;
            console.log(`Uploading file: ${relativePath} with prefix: ${prefix}`);

            return await storage.put(
                relativePath,
                file.buffer,
                {
                    contentType: file.mimetype,
                    prefix
                }
            );
        }));
        console.log('File upload results:', results);

        // Send request to create project in gateway
        console.log('Creating project in gateway');
        const response = await fetch(`${process.env.GATEWAY_URL}/api/project`, {
            method: 'POST',
            headers: {
                'Authorization': req.headers.authorization as string,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: projectName,
                description: `Project created from file upload: ${validFiles.map(f => f.originalname).join(', ')}`,
                contentHash,
                isPrivate: true
            })
        });

        if (!response.ok) {
            console.error('Failed to create project:', response.status);
            throw new AppError(response.status, 'Failed to create project');
        }

        const project = await response.json();
        console.log('Project created successfully:', project);

        res.json({
            message: 'Files uploaded successfully and project created',
            files: results,
            project
        });
    } catch (error) {
        console.error('Upload error:', error);
        if (error instanceof AppError) {
            next(error);
        } else {
            next(new AppError(500, 'Internal server error during upload'));
        }
    }
};

export const getFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { objectKey } = req.params;

        if (!objectKey) {
            throw new AppError(400, 'Object key is required');
        }

        const file = await storage.getFileFromR2(objectKey);
        res.type(file.type);
        res.send(Buffer.from(await file.arrayBuffer()));
    } catch (error) {
        next(error);
    }
};

export const getSignedDownloadUrl = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { objectKey } = req.params;
        const { expiresIn } = req.query;

        if (!objectKey) {
            throw new AppError(400, 'Object key is required');
        }

        const url = await storage.getDownloadUrl(
            objectKey,
            typeof expiresIn === 'string' ? parseInt(expiresIn) : undefined
        );
        res.json({ url });
    } catch (error) {
        next(error);
    }
};

export const clearBucketHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await storage.clearBucket();
        res.json({ message: 'Bucket cleared successfully' });
    } catch (error) {
        next(error);
    }
};

export const listBucketContents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { bucketId } = req.params;
        const contents = await storage.listBucketContents(bucketId);
        res.json(contents);
    } catch (error) {
        next(error);
    }
};