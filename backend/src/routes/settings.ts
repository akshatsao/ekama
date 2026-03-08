import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { getStoreSettingsCollection } from '../utils/database';
import { authenticate, authorizeAdmin } from '../middleware/auth';

const router = express.Router();

const uploadsRoot = path.resolve(__dirname, '../../../public/uploads');
if (!fs.existsSync(uploadsRoot)) {
    fs.mkdirSync(uploadsRoot, { recursive: true });
}

const upload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
            cb(null, uploadsRoot);
        },
        filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `${uuidv4()}${ext}`);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadVideo = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
            cb(null, uploadsRoot);
        },
        filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname);
            cb(null, `${uuidv4()}${ext}`);
        }
    }),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for videos
});

// Public route to get home page layout settings
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const settings = getStoreSettingsCollection();
        const doc = await settings.findOne({ id });

        if (!doc) {
            res.status(404).json({ error: 'Settings not found' });
            return;
        }

        res.json(doc);
    } catch (error) {
        console.error('Failed to fetch settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Admin ONLY route to handle file uploads for settings
router.post('/upload', authenticate, authorizeAdmin, upload.array('images', 5), (req, res) => {
    try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            res.status(400).json({ error: 'No image files provided' });
            return;
        }
        const imageUrls = req.files.map((file: Express.Multer.File) => `/uploads/${file.filename}`);
        res.status(200).json({ urls: imageUrls });
        return;
    } catch (error) {
        console.error('Failed to upload image:', error);
        res.status(500).json({ error: 'Failed to process image upload' });
    }
});

// Admin ONLY route to handle video uploads for settings
router.post('/upload/video', authenticate, authorizeAdmin, uploadVideo.single('video'), (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No video file provided' });
            return;
        }
        const videoUrl = `/uploads/${req.file.filename}`;
        res.status(200).json({ url: videoUrl });
        return;
    } catch (error) {
        console.error('Failed to upload video:', error);
        res.status(500).json({ error: 'Failed to process video upload' });
    }
});

// Admin ONLY route to update layout settings
router.put('/:id', authenticate, authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Remove system fields to prevent tampering
        delete updateData._id;
        delete updateData.id;
        delete updateData.createdAt;

        updateData.updatedAt = new Date();

        const settings = getStoreSettingsCollection();
        const result = await settings.findOneAndUpdate(
            { id },
            { $set: updateData },
            { returnDocument: 'after' }
        );

        if (!result) {
            res.status(404).json({ error: 'Settings not found' });
            return;
        }

        res.json(result);
    } catch (error) {
        console.error('Failed to update settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;
