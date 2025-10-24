import { UserDB } from '@/services/db/users';
import { getServerTranslation } from '@/services/i18n-server';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body as { username: string; password: string };

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: getServerTranslation(req, 'auth.usernameRequired'),
      });
    }

    // Vérifier les identifiants
    const user = UserDB.verifyUser(username, password);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: getServerTranslation(req, 'auth.invalidCredentials'),
      });
    }

    // Créer une session
    const token = UserDB.createSession(user.id);
    if (!token) {
      return res.status(500).json({
        success: false,
        error: getServerTranslation(req, 'auth.loginError'),
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: getServerTranslation(req, 'auth.loginError'),
    });
  }
}
