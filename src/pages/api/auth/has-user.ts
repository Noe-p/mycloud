import { UserDB } from '@/services/db/users';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const hasUser = UserDB.hasAnyUser();
    return res.status(200).json({ hasUser });
  } catch (error) {
    console.error('Check user error:', error);
    return res.status(500).json({ hasUser: false });
  }
}
