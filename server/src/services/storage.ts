import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config.js';

export const s3 = new S3Client({
  region: config.s3.region,
  endpoint: config.s3.endpoint,
  forcePathStyle: config.s3.forcePathStyle,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
});

export async function createPresignedUploadUrl(key: string, contentType: string, expiresIn = 60 * 5): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, cmd, { expiresIn });
}

export function publicUrlForKey(key: string): string {
  if (config.s3.publicBaseUrl) {
    return `${config.s3.publicBaseUrl.replace(/\/$/, '')}/${key}`;
  }
  if (config.s3.endpoint) {
    return `${config.s3.endpoint.replace(/\/$/, '')}/${config.s3.bucket}/${key}`;
  }
  return `https://${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com/${key}`;
}
