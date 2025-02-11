import express from 'express';
import { verifyAdminToken } from '../middleware/userTokenMiddleware.js';
import * as dataProvider from '../providers/dataProvider.js';
import * as config from '../../config.js';

export const router = express.Router();
const games_library = config.getGamesLibraryLocation();

router.post('/create', verifyAdminToken, async(req, res) => {
    if (!req.files || !req.files.file) {
        return res.status(422).send('No files were uploaded');
    }
    if (!req.body.gamePath) {
        return res.status(422).send('Empty game path');
    }
    dataProvider.saveGameBundle(games_library, req.body.gamePath, req.files.file);
    res.status(200).json({ "success": true });
});

