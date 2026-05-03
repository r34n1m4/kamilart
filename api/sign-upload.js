const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

function sanitizeKey(name) {
  return name
    .toString()
    .trim()
    .replace(/\\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '');
}

function isValidMimeType(type) {
  return typeof type === 'string' && ALLOWED_MIME_TYPES.includes(type.toLowerCase());
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { fileName, fileType, fileSize } = req.body || {};

    console.log('[sign-upload] request received', {
      fileName,
      fileType,
      fileSize,
    });

    if (!fileName || !fileType || typeof fileSize !== 'number') {
      console.error('[sign-upload] missing required file metadata');
      res.status(400).json({ error: 'Missing file metadata' });
      return;
    }

    if (!isValidMimeType(fileType)) {
      console.error('[sign-upload] unsupported mime type', { fileType });
      res.status(415).json({ error: 'Unsupported file type' });
      return;
    }

    if (fileSize <= 0 || fileSize > MAX_FILE_SIZE_BYTES) {
      console.error('[sign-upload] invalid file size', { fileSize });
      res.status(413).json({ error: 'File too large' });
      return;
    }

    const accountId = process.env.R2_ACCOUNT_ID;
    const bucket = process.env.R2_BUCKET;
    const token = process.env.R2_API_TOKEN;
    const publicUrl = process.env.R2_PUBLIC_URL;

    if (!accountId || !bucket || !token || !publicUrl) {
      console.error('[sign-upload] missing R2 environment variables');
      res.status(500).json({ error: 'R2 environment variables are not configured.' });
      return;
    }

    const sanitizedFileName = sanitizeKey(fileName) || 'file';
    const objectKey = `${Date.now()}-${sanitizedFileName}`;
    const encodedKey = encodeURIComponent(objectKey);
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects/${encodedKey}/signed_url`;

    console.log('[sign-upload] generating signed URL', {
      url,
      fileType,
      fileSize,
      key: objectKey,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'PUT',
        expiry: 3600,
      }),
    });

    const result = await response.json();
    if (!response.ok || !result?.result?.url) {
      console.error('[sign-upload] failed to generate signed URL', {
        status: response.status,
        statusText: response.statusText,
        result,
      });
      res.status(500).json({ error: 'Unable to generate upload URL' });
      return;
    }

    const uploadUrl = result.result.url;
    const publicUrlFull = `${publicUrl.replace(/\/+$/, '')}/${encodedKey}`;

    console.log('[sign-upload] signed URL generated', {
      uploadUrl: uploadUrl.slice(0, 80) + '...',
      publicUrl: publicUrlFull,
      key: objectKey,
    });

    res.status(200).json({ uploadUrl, publicUrl: publicUrlFull, key: objectKey });
  } catch (error) {
    console.error('[sign-upload] unexpected error', error);
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
}
