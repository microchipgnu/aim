import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand, type ListObjectsV2CommandOutput, type _Object } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from 'crypto';

export const cloudflareClientR2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

export async function put(filename: string, body: Blob | ReadableStream | string | Uint8Array, options: {
    access?: 'public' | 'private';
    addRandomSuffix?: boolean;
    contentType?: string;
    prefix?: string;
} = {}): Promise<{ url: string; pathname: string }> {
    try {
        const {
            access = 'private',
            addRandomSuffix = false,
            contentType,
            prefix = ''
        } = options;

        let objectKey = prefix ? `${prefix}/${filename}` : filename;
        if (addRandomSuffix) {
            const randomSuffix = crypto.randomBytes(4).toString('hex');
            const extension = filename.split('.').pop();
            objectKey = `${filename.slice(0, -extension!.length - 1)}-${randomSuffix}.${extension}`;
            if (prefix) objectKey = `${prefix}/${objectKey}`;
        }

        let finalBody: ReadableStream | Blob | string | Uint8Array;
        let finalContentType = contentType;

        if (body instanceof Blob) {
            finalBody = body;
            finalContentType = finalContentType || body.type || 'application/octet-stream';
        } else if (body instanceof ReadableStream) {
            finalBody = body;
        } else if (typeof body === 'string') {
            finalBody = body;
            finalContentType = finalContentType || 'text/plain';
        } else if (body instanceof Uint8Array) {
            finalBody = body;
            finalContentType = finalContentType || 'application/octet-stream';
        } else {
            throw new Error('Unsupported body type');
        }

        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: objectKey,
            Body: finalBody,
            ContentType: finalContentType,
            ACL: access === 'public' ? 'public-read' : 'private'
        });

        await cloudflareClientR2.send(command);

        const url = access === 'public'
            ? `https://pub-a3d5fe16201c4c0a90b7ae5076d46ac8.r2.dev/${objectKey}`
            : await getDownloadUrl(objectKey);

        return {
            url,
            pathname: objectKey
        };
    } catch (error) {
        console.error("Error uploading file to R2:", error);
        throw error;
    }
}

export async function getDownloadUrl(objectKey: string, expiresIn: number = 3600): Promise<string> {
    try {
        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: objectKey,
        });

        const url = await getSignedUrl(cloudflareClientR2, command, { expiresIn });
        return url;
    } catch (error) {
        console.error("Error generating download URL:", error);
        throw error;
    }
}

export async function getFileFromR2(objectKey: string): Promise<Blob> {
    try {
        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: objectKey,
        });

        const response = await cloudflareClientR2.send(command);

        if (response.Body instanceof ReadableStream) {
            return new Blob([await new Response(response.Body).arrayBuffer()]);
        } else {
            throw new Error("Unexpected response body type");
        }
    } catch (error) {
        console.error("Error retrieving file from R2:", error);
        throw error;
    }
}

export async function clearBucket(): Promise<void> {
    try {
        const listCommand = new ListObjectsV2Command({
            Bucket: process.env.R2_BUCKET_NAME,
        });

        const listResponse = await cloudflareClientR2.send(listCommand);

        if (!listResponse.Contents || listResponse.Contents.length === 0) {
            return;
        }

        const deleteCommand = new DeleteObjectsCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Delete: {
                Objects: listResponse.Contents.map(({ Key }) => ({ Key: Key! })),
                Quiet: true
            }
        });

        await cloudflareClientR2.send(deleteCommand);
    } catch (error) {
        console.error("Error clearing bucket:", error);
        throw error;
    }
}

export async function listBucketContents(bucketId: string): Promise<Array<{ key: string; size: number; lastModified: Date; path: string }>> {
    try {
        const allObjects: Array<{ key: string; size: number; lastModified: Date; path: string }> = [];
        let continuationToken: string | undefined = undefined;

        do {
            const command: ListObjectsV2Command = new ListObjectsV2Command({
                Bucket: process.env.R2_BUCKET_NAME,
                Prefix: `${bucketId}/`, // Add prefix to only get objects from this project's folder
                ContinuationToken: continuationToken,
            });

            const response: ListObjectsV2CommandOutput = await cloudflareClientR2.send(command);

            if (response.Contents) {
                allObjects.push(...response.Contents.map((obj: _Object) => {
                    const key = obj.Key!;
                    // Extract path by removing the project ID prefix
                    const path = key.replace(`${bucketId}/`, '');

                    return {
                        key,
                        size: obj.Size!,
                        lastModified: obj.LastModified!,
                        path
                    };
                }));
            }

            continuationToken = response.NextContinuationToken;
        } while (continuationToken);

        return allObjects;
    } catch (error) {
        console.error("Error listing bucket contents:", error);
        throw error;
    }
}
