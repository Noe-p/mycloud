import type { NextApiRequest, NextApiResponse } from 'next';

// Méthodes HTTP autorisées utilitaire
export function allowMethods(
  req: NextApiRequest,
  res: NextApiResponse,
  methods: string[],
): boolean {
  if (!req.method || !methods.includes(req.method)) {
    res.setHeader('Allow', methods.join(', '));
    res.status(405).json({ error: 'Method not allowed' });
    return false;
  }
  return true;
}

// Récupération pagination uniforme avec bornes
export function getPagination(
  req: NextApiRequest,
  defaults: { limit?: number; offset?: number } = {},
) {
  const defLimit = defaults.limit ?? 50;
  const defOffset = defaults.offset ?? 0;
  const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
  const rawOffset = Array.isArray(req.query.offset) ? req.query.offset[0] : req.query.offset;

  const rawLimitStr = rawLimit != null ? String(rawLimit) : undefined;
  const rawOffsetStr = rawOffset != null ? String(rawOffset) : undefined;

  let limit = parseInt(rawLimitStr ?? `${defLimit}`, 10);
  let offset = parseInt(rawOffsetStr ?? `${defOffset}`, 10);

  if (!Number.isFinite(limit) || limit <= 0) limit = defLimit;
  if (limit > 500) limit = 500; // garde-fou
  if (!Number.isFinite(offset) || offset < 0) offset = defOffset;

  return { limit, offset };
}

// Utilitaire centralisé MEDIA_DIRS
export function requireMediaDirs(res: NextApiResponse): string[] | null {
  const env = process.env.MEDIA_DIRS || process.env.MEDIA_DIR || '';
  const mediaDirs = env
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);
  if (mediaDirs.length === 0) {
    res.status(500).json({ error: 'MEDIA_DIRS not set' });
    return null;
  }
  return mediaDirs;
}
