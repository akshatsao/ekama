import path from 'path';
import fs from 'fs';

/**
 * Returns the absolute path to the uploads directory.
 * Consistently uses backend/public/uploads relative to the project structure.
 */
export function getUploadsDir(): string {
    // In development (running from src): backend/src/../public/uploads -> backend/public/uploads
    // In production (running from dist): backend/dist/../public/uploads -> backend/public/uploads
    const uploadsDir = path.resolve(__dirname, '../../public/uploads');

    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    return uploadsDir;
}
