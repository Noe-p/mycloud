import { ScanState } from '@/types/Scan';
import type { NextApiResponse } from 'next';

type SSEClient = {
  id: string;
  res: NextApiResponse;
};

const clients: SSEClient[] = [];

export function registerSSEClient(res: NextApiResponse) {
  const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  clients.push({ id: clientId, res });

  const unsubscribe = () => {
    const index = clients.findIndex((c) => c.id === clientId);
    if (index !== -1) {
      clients.splice(index, 1);
    }
  };

  return { clientId, unsubscribe };
}

export function broadcastScanProgress(state: ScanState) {
  const data = JSON.stringify(state);
  clients.forEach((client) => {
    try {
      client.res.write(`data: ${data}\n\n`);
    } catch {
      // Best effort; drop on write errors. Client will be removed on disconnect.
    }
  });
}

export function getClientCount() {
  return clients.length;
}
