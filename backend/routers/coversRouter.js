import express from 'express';
import fs from 'fs';
import { verifyAdminToken } from '../middleware/userTokenMiddleware.js';
import { logger } from '../logger/logger.js';
import * as config from '../../config.js';
import * as dataProvider from '../providers/dataProvider.js';

export const router = express.Router();
const gamesLibrary = config.getGamesLibraryLocation();

router.post('/add', verifyAdminToken, async(req, res) => {
    if (!req.files || !req.files.cover) {
        return res.status(422).send('No files were uploaded');
    }
    dataProvider.addCover(gamesLibrary, req.body.gamePath, req.files.cover);
    res.status(200).json({
        initialPreview: [ `/library/${req.body.gamePath}/metadata/cover?${Math.floor(Math.random() * 500)}` ],
        initialPreviewConfig: [{
            url: `/api/covers/delete/${req.body.gamePath}`,
        }],
        initialPreviewAsData: true
    });
});

router.post('/delete/:gamePath', verifyAdminToken, async(req, res) => {
    var gamePath = req.params.gamePath;
    logger.debug(`Deleting cover from path: ${gamePath}`);
    if (fs.existsSync(`${gamesLibrary}/${gamePath}/metadata/cover`)) {
        fs.rmSync(`${gamesLibrary}/${gamePath}/metadata/cover`);
    }
    res.status(200).json({ "success": true });
});
