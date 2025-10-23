import { readScanState } from '@/services/api/scanner';
import { getClientCount, registerSSEClient } from '@/services/api/sse';
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Configuration SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Désactiver le buffering nginx

  // Enregistrer le client via le service SSE
  const { clientId, unsubscribe } = registerSSEClient(res);
  console.log(`[SSE] Client connecté: ${clientId} (total: ${getClientCount()})`);

  // Envoyer un message de connexion réussie
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);
  // Suggérer un délai de reconnexion côté client (EventSource le supporte)
  res.write('retry: 5000\n\n');

  // Envoyer l'état actuel du scan s'il existe
  try {
    const currentState = readScanState();
    if (currentState) {
      res.write(`data: ${JSON.stringify(currentState)}\n\n`);
    }
  } catch (error) {
    console.error('[SSE] Erreur lecture état initial:', error);
  }

  // Heartbeat pour garder la connexion active
  const heartbeatInterval = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000); // Toutes les 15 secondes

  // Gérer la déconnexion du client
  req.on('close', () => {
    clearInterval(heartbeatInterval);
    unsubscribe();
    console.log(`[SSE] Client déconnecté: ${clientId} (restants: ${getClientCount()})`);
  });
}
