import { UserDB } from '@/services/db/users';
import { getServerTranslation } from '@/services/i18n-server';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body as { username: string; password: string };

    // Vérifier si un utilisateur existe déjà (limite à 1 utilisateur)
    if (UserDB.hasAnyUser()) {
      return res.status(403).json({
        success: false,
        error: getServerTranslation(req, 'auth.userAlreadyExists'),
      });
    }

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: getServerTranslation(req, 'auth.usernameRequired'),
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: getServerTranslation(req, 'auth.passwordTooShort'),
      });
    }

    // Vérifier si l'utilisateur existe déjà
    if (UserDB.usernameExists(username)) {
      return res.status(409).json({
        success: false,
        error: getServerTranslation(req, 'auth.usernameTaken'),
      });
    }

    // Créer l'utilisateur
    const user = UserDB.createUser(username, password);
    if (!user) {
      return res.status(500).json({
        success: false,
        error: getServerTranslation(req, 'auth.registerError'),
      });
    }

    // Créer une session
    const token = UserDB.createSession(user.id);
    if (!token) {
      return res.status(500).json({
        success: false,
        error: getServerTranslation(req, 'auth.registerError'),
      });
    }

    return res.status(201).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      error: getServerTranslation(req, 'auth.registerError'),
    });
  }
}
