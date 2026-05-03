import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

function sanitizeKey(name) {
  return name
    .toString()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[_-]+|[_-]+$/g, "");
}

function isValidMimeType(type) {
  return typeof type === "string" && ALLOWED_MIME_TYPES.includes(type.toLowerCase());
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { fileName, fileType, fileSize } = req.body || {};

    console.log("[sign-upload] request received", {
      fileName,
      fileType,
      fileSize,
    });

    if (!fileName || !fileType || typeof fileSize !== "number") {
      return res.status(400).json({ error: "Missing file metadata" });
    }

    if (!isValidMimeType(fileType)) {
      return res.status(415).json({ error: "Unsupported file type" });
    }

    if (fileSize <= 0 || fileSize > MAX_FILE_SIZE_BYTES) {
      return res.status(413).json({ error: "File too large" });
    }

    const {
      R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY,
      R2_BUCKET,
      R2_ENDPOINT,
      R2_PUBLIC_URL,
    } = process.env;

    if (
      !R2_ACCOUNT_ID ||
      !R2_ACCESS_KEY_ID ||
      !R2_SECRET_ACCESS_KEY ||
      !R2_BUCKET ||
      !R2_ENDPOINT ||
      !R2_PUBLIC_URL
    ) {
      console.error("[sign-upload] missing env vars");
      return res.status(500).json({
        error: "R2 environment variables are not configured",
      });
    }

    const client = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });

    const safeName = sanitizeKey(fileName) || "file";
    const key = `${Date.now()}-${safeName}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: fileType,
    });

    console.log("[sign-upload] generating presigned URL", { key });

    const uploadUrl = await getSignedUrl(client, command, {
      expiresIn: 60 * 10, // 10 minutes
    });

    const publicUrl = `${R2_PUBLIC_URL.replace(/\/+$/, "")}/${key}`;

    console.log("[sign-upload] success", {
      key,
      uploadUrl: uploadUrl.slice(0, 80) + "...",
      publicUrl,
    });

    return res.status(200).json({
      uploadUrl,
      publicUrl,
      key,
    });
  } catch (error) {
    console.error("[sign-upload] unexpected error", error);
    return res.status(500).json({
      error: "Failed to generate upload URL",
    });
  }
}