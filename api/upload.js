export const config = {
  api: {
    bodyParser: false,
  },
};

const RAW_BODY_LIMIT_BYTES = 16 * 1024 * 1024;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

function isValidMimeType(type) {
  return typeof type === 'string' && ALLOWED_MIME_TYPES.includes(type.toLowerCase());
}

function getJsonBody(req, limitBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject({ type: 'size', size });
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      const rawBody = Buffer.concat(chunks).toString('utf8');
      try {
        const parsed = JSON.parse(rawBody || '{}');
        resolve(parsed);
      } catch (error) {
        reject({ type: 'parse', error });
      }
    });

    req.on('error', (error) => reject({ type: 'error', error }));
  });
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    let body = req.body;
    if (!body) {
      try {
        body = await getJsonBody(req, RAW_BODY_LIMIT_BYTES);
      } catch (parseError) {
        if (parseError && parseError.type === 'size') {
          console.error('[upload] request body too large', parseError);
          res.status(413).json({ error: 'File too large' });
          return;
        }

        if (parseError && parseError.type === 'parse') {
          console.error('[upload] invalid JSON payload', parseError.error);
          res.status(400).json({ error: 'Invalid file data' });
          return;
        }

        console.error('[upload] failed to read request body', parseError);
        res.status(400).json({ error: 'Invalid request body' });
        return;
      }
    }

    const { fileName, fileType, fileData } = body;

    console.log('[upload] received request', {
      method: req.method,
      fileName,
      fileType,
      hasFileData: Boolean(fileData),
    });

    if (!fileName || !fileData) {
      console.error('[upload] missing fileName or fileData');
      res.status(400).json({ error: 'Missing file data' });
      return;
    }

    if (!isValidMimeType(fileType)) {
      console.error('[upload] unsupported mime type', { fileType });
      res.status(415).json({ error: 'Unsupported file type' });
      return;
    }

    let buffer;
    try {
      buffer = Buffer.from(fileData, 'base64');
    } catch (error) {
      console.error('[upload] invalid base64 file data', error);
      res.status(400).json({ error: 'Invalid file data' });
      return;
    }

    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      console.error('[upload] invalid buffer after base64 decode');
      res.status(400).json({ error: 'Invalid file data' });
      return;
    }

    console.log('[upload] decoded file buffer', {
      fileName,
      fileType,
      fileSizeBytes: buffer.length,
    });

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      console.error('[upload] file too large', { size: buffer.length });
      res.status(413).json({ error: 'File too large' });
      return;
    }

    const accountId = process.env.R2_ACCOUNT_ID;
    const bucket = process.env.R2_BUCKET;
    const token = process.env.R2_API_TOKEN;
    const publicUrl = process.env.R2_PUBLIC_URL;

    if (!accountId || !bucket || !token || !publicUrl) {
      console.error('[upload] missing R2 environment variables');
      res.status(500).json({ error: 'R2 environment variables are not configured.' });
      return;
    }

    const encodedName = encodeURIComponent(fileName);
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects/${encodedName}`;

    console.log('[upload] uploading to R2', { url, contentType: fileType });

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': fileType,
      },
      body: buffer,
    });

    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      result = await response.text();
      console.error('[upload] failed to parse R2 response as JSON', jsonError, result);
    }

    if (!response.ok) {
      console.error('[upload] R2 upload failed', {
        status: response.status,
        statusText: response.statusText,
        result,
      });
      res.status(500).json({ error: 'Upload failed', details: result });
      return;
    }

    const fileUrl = `${publicUrl}/${encodedName}`;
    console.log('[upload] upload successful', { fileUrl });
    res.status(200).json({ url: fileUrl });
  } catch (error) {
    console.error('[upload] unexpected error', error);
    res.status(500).json({ error: 'Upload failed' });
  }
}
