export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const { fileName, fileType, fileData } = req.body;

    if (!fileName || !fileData) {
      res.status(400).json({ error: 'Missing file data' });
      return;
    }

    const buffer = Buffer.from(fileData, 'base64');
    const accountId = process.env.R2_ACCOUNT_ID;
    const bucket = process.env.R2_BUCKET;
    const token = process.env.R2_API_TOKEN;
    const publicUrl = process.env.R2_PUBLIC_URL;

    if (!accountId || !bucket || !token || !publicUrl) {
      res.status(500).json({ error: 'R2 environment variables are not configured.' });
      return;
    }

    const encodedName = encodeURIComponent(fileName);
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects/${encodedName}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': fileType || 'application/octet-stream',
      },
      body: buffer,
    });

    const result = await response.json();
    if (!response.ok) {
      res.status(500).json({ error: 'Upload failed', details: result });
      return;
    }

    const fileUrl = `${publicUrl}/${encodedName}`;
    res.status(200).json({ url: fileUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
}
