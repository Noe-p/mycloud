import { exec } from 'child_process';
import fs from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import { promisify } from 'util';

const execPromise = promisify(exec);
const thumbDir = process.env.THUMB_DIR || '';
const mediaDir = process.env.MEDIA_DIR || '';

async function getVideoDuration(filePath: string): Promise<string | null> {
  try {
    const { stdout } = await execPromise(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
    );
    const seconds = parseFloat(stdout.trim());
    if (isNaN(seconds)) return null;

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  } catch {
    return null;
  }
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  if (!thumbDir || !mediaDir) {
    return res.status(500).json({ error: 'THUMB_DIR or MEDIA_DIR not set' });
  }
  const files = fs.readdirSync(mediaDir);
  const thumbsPromises = files
    .filter((file) => /\.(jpg|jpeg|png|gif|heic|mp4|mov|avi|mkv|hevc)$/i.test(file))
    .map(async (file) => {
      const isVideo = /\.(mp4|mov|avi|mkv|hevc)$/i.test(file);
      const mediaPath = path.join(mediaDir, file);
      const duration = isVideo ? await getVideoDuration(mediaPath) : null;
      const thumbPath = path.join(thumbDir, file + '.thumb.jpg');
      const thumbReady = fs.existsSync(thumbPath);
      const stats = fs.statSync(mediaPath);
      const createdDate =
        stats.birthtime && stats.birthtime.getTime() ? stats.birthtime : stats.mtime;
      return {
        file,
        thumb: `/thumbs/${file}.thumb.jpg`,
        type: isVideo ? 'video' : 'image',
        duration,
        thumbReady,
        createdAt: createdDate.toISOString(),
      };
    });
  const thumbs = await Promise.all(thumbsPromises);
  res.status(200).json({ thumbs });
}
