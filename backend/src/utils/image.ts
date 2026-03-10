import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

/**
 * Optimizes an image:
 * 1. Converts to WebP
 * 2. Resizes to a maximum width (default 1200px)
 * 3. Compresses (quality 80)
 * 
 * @param inputPath Path to the original uploaded file
 * @param outputDir Directory to save the optimized file
 * @returns The filename of the optimized image
 */
export async function optimizeImage(inputPath: string, outputDir: string): Promise<string> {
    const filename = path.parse(inputPath).name + '.webp';
    const outputPath = path.join(outputDir, filename);

    await sharp(inputPath)
        .resize(1200, null, { withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);

    // Optional: delete the original non-optimized file to save space
    try {
        if (inputPath !== outputPath && fs.existsSync(inputPath)) {
            fs.unlinkSync(inputPath);
        }
    } catch (err) {
        console.error('Failed to delete original image:', err);
    }

    return filename;
}
