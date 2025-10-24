import { UserDB } from '@/services/db/users';
import { getServerTranslation } from '@/services/i18n-server';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { token } = req.body as { token: string };

    if (!token) {
      return res.status(400).json({
        success: false,
        error: getServerTranslation(req, 'auth.unauthorized'),
      });
    }

    // Supprimer la session
    const deleted = UserDB.deleteSession(token);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: getServerTranslation(req, 'auth.sessionExpired'),
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: getServerTranslation(req, 'auth.loginError'),
    });
  }
}
