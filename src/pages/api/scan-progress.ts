import { ScanState } from '@/types/Scan';
import { NextApiRequest, NextApiResponse } from 'next';

// Gestion des clients SSE
type SSEClient = {
  id: string;
  res: NextApiResponse;
};

const clients: SSEClient[] = [];

// Fonction pour diffuser un message à tous les clients connectés
export function broadcastScanProgress(state: ScanState) {
  const data = JSON.stringify(state);
  clients.forEach((client) => {
    client.res.write(`data: ${data}\n\n`);
  });
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Configuration SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Désactiver le buffering nginx

  // Générer un ID unique pour ce client
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Ajouter le client à la liste
  const client: SSEClient = { id: clientId, res };
  clients.push(client);

  console.log(`[SSE] Client connecté: ${clientId} (total: ${clients.length})`);

  // Envoyer un message de connexion réussie
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

  // Envoyer l'état actuel du scan s'il existe
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
    const scanStatePath = path.join(process.cwd(), 'public', 'scan-state.json');

    if (fs.existsSync(scanStatePath)) {
      const stateContent = fs.readFileSync(scanStatePath, 'utf-8') as string;
      const currentState = JSON.parse(stateContent) as ScanState;
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
    const index = clients.findIndex((c) => c.id === clientId);
    if (index !== -1) {
      clients.splice(index, 1);
    }
    console.log(`[SSE] Client déconnecté: ${clientId} (restants: ${clients.length})`);
  });
}
