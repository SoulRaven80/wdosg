import express from 'express';
import { verifyToken } from '../middleware/userTokenMiddleware.js';
import * as dataProvider from '../providers/dataProvider.js';
import * as config from '../../config.js';
import { logger } from '../logger/logger.js';

export const router = express.Router();
const games_library = config.getGamesLibraryLocation();

router.post('/upload', verifyToken, async(req, res) => {
    if (!req.files || !req.files.file) {
        return res.status(422).send('No files were uploaded');
    }
    try {
        dataProvider.appendSavegame(games_library, req.body.gamePath, req.files.file);
    } catch {
        logger.error(`Error trying to store savegames for ${req.body.gamePath}`);
    }
    res.status(200).json({ success: true });
});

