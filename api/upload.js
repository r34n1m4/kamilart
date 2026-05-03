export default async function handler(req, res) {
  res.status(405).json({ error: 'Deprecated endpoint. Use /api/sign-upload for direct R2 uploads.' });
}
