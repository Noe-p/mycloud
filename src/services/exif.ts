import { exiftool } from 'exiftool-vendored';
import fs from 'fs';
import path from 'path';

// Cache des dates EXIF pour éviter de relire les fichiers à chaque fois
const dateCache = new Map<string, Date>();
const CACHE_FILE = path.join(process.cwd(), 'public', 'exif-cache.json');

// Charger le cache au démarrage
function loadCache(): void {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      Object.entries(data).forEach(([key, value]) => {
        dateCache.set(key, new Date(value as string));
      });
    }
  } catch (error) {
    console.error('Error loading EXIF cache:', error);
  }
}

// Sauvegarder le cache (de manière asynchrone pour ne pas bloquer)
function saveCache(): void {
  try {
    const data: Record<string, string> = {};
    dateCache.forEach((date, key) => {
      data[key] = date.toISOString();
    });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving EXIF cache:', error);
  }
}

// Charger le cache au démarrage du module
loadCache();

// Sauvegarder le cache toutes les 5 minutes
let cacheModified = false;
setInterval(() => {
  if (cacheModified) {
    saveCache();
    cacheModified = false;
  }
}, 5 * 60 * 1000);

/**
 * Obtenir la date de création d'un média (EXIF ou stats fichier)
 */
export async function getMediaDate(filePath: string): Promise<Date> {
  // Vérifier le cache d'abord
  if (dateCache.has(filePath)) {
    return dateCache.get(filePath)!;
  }

  try {
    const stats = fs.statSync(filePath);
    let mediaDate: Date;

    // Tenter de lire les métadonnées EXIF pour les images
    const isImage = /\.(jpg|jpeg|png|gif|heic)$/i.test(filePath);
    
    if (isImage) {
      try {
        const metadata = await exiftool.read(filePath);
        
        // Chercher la date de prise de vue dans plusieurs champs EXIF
        const exifDate =
          metadata.DateTimeOriginal ||
          metadata.CreateDate ||
          metadata.DateCreated ||
          metadata.MediaCreateDate;

        if (exifDate && exifDate instanceof Date && !isNaN(exifDate.getTime())) {
          mediaDate = exifDate;
        } else {
          // Fallback sur la date du fichier
          mediaDate = stats.birthtime && stats.birthtime.getTime() ? stats.birthtime : stats.mtime;
        }
      } catch {
        // En cas d'erreur EXIF, utiliser la date du fichier
        mediaDate = stats.birthtime && stats.birthtime.getTime() ? stats.birthtime : stats.mtime;
      }
    } else {
      // Pour les vidéos, utiliser la date du fichier (extraction EXIF vidéo plus lourde)
      mediaDate = stats.birthtime && stats.birthtime.getTime() ? stats.birthtime : stats.mtime;
    }

    // Mettre en cache
    dateCache.set(filePath, mediaDate);
    cacheModified = true;

    return mediaDate;
  } catch (error) {
    console.error('Error getting media date:', error);
    // En cas d'erreur, retourner la date actuelle
    return new Date();
  }
}

/**
 * Nettoyer les ressources exiftool
 */
export async function closeExifTool(): Promise<void> {
  try {
    await exiftool.end();
  } catch (error) {
    console.error('Error closing exiftool:', error);
  }
}
