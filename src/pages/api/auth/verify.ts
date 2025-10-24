import { UserDB } from '@/services/db/users';
import { getServerTranslation } from '@/services/i18n-server';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { token } = req.query as { token: string };

    if (!token) {
      return res.status(401).json({
        success: false,
        error: getServerTranslation(req, 'auth.unauthorized'),
      });
    }

    // Récupérer l'utilisateur à partir du token
    const user = UserDB.getUserByToken(token);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: getServerTranslation(req, 'auth.sessionExpired'),
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Verify error:', error);
    return res.status(500).json({
      success: false,
      error: getServerTranslation(req, 'auth.loginError'),
    });
  }
}
