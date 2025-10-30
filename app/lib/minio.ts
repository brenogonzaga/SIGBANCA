import * as Minio from "minio";

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "sigbanca",
  secretKey: process.env.MINIO_SECRET_KEY || "sigbanca123",
});

export const BUCKET_NAME = process.env.MINIO_BUCKET || "sigbanca-files";
export const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL || "http://localhost:9000";

export async function ensureBucketExists() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, "us-east-1");
      console.log(`Bucket ${BUCKET_NAME} criado com sucesso`);

      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    }
  } catch (error) {
    console.error("Erro ao criar bucket:", error);
    throw error;
  }
}

export async function uploadFile(
  file: File,
  path: string
): Promise<{ url: string; size: number }> {
  await ensureBucketExists();

  const buffer = Buffer.from(await file.arrayBuffer());

  await minioClient.putObject(BUCKET_NAME, path, buffer, buffer.length, {
    "Content-Type": file.type || "application/octet-stream",
  });

  const url = `${MINIO_PUBLIC_URL}/${BUCKET_NAME}/${path}`;

  return {
    url,
    size: buffer.length,
  };
}

export async function getDownloadUrl(
  path: string,
  expirySeconds: number = 3600
): Promise<string> {
  return await minioClient.presignedGetObject(BUCKET_NAME, path, expirySeconds);
}

export async function deleteFile(path: string): Promise<void> {
  await minioClient.removeObject(BUCKET_NAME, path);
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await minioClient.statObject(BUCKET_NAME, path);
    return true;
  } catch {
    return false;
  }
}
