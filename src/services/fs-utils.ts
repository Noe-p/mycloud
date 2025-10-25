import fs from 'fs';
import path from 'path';

// Écrit un JSON de manière atomique (écrit dans un fichier temporaire puis renomme)
export function atomicWriteJson(filePath: string, data: unknown, pretty = 2): void {
  const dir = path.dirname(filePath);
  const tmp = path.join(dir, `.${path.basename(filePath)}.tmp`);
  const json = JSON.stringify(data, null, pretty) + '\n';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(tmp, json);
  fs.renameSync(tmp, filePath);
}

// Lecture JSON tolérante aux erreurs
export function safeReadJson<T = unknown>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const txt = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(txt) as T;
  } catch {
    return null;
  }
}
