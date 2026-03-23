import express from 'express';
import { verifyAdminToken } from '../middleware/userTokenMiddleware.js';
import * as dataProvider from '../providers/dataProvider.js';
import * as config from '../../config.js';

export const router = express.Router();
const games_library = config.getGamesLibraryLocation();
const fileTypes = {
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
    'pdf': 'pdf',
    'txt': 'text'
};

router.get('/', verifyAdminToken, (req, res) => {
    var list = dataProvider.listAttachments(req.query.gameId);
    res.status(200).json(list);
});

router.post('/add', verifyAdminToken, (req, res) => {
    if (!req.files || !req.files.attachments) {
        return res.status(422).send('No files were uploaded');
    }
    dataProvider.addAttachment(games_library, req.body.gamePath, req.body.gameId, req.files.attachments);
    res.status(200).json({
        'initialPreview': [`/library/${req.body.gamePath}/attachments/${req.files.attachments.name}`],
        'initialPreviewConfig': [{
            caption: req.files.attachments.name,
            filename: req.files.attachments.name,
            type: fileTypes[req.files.attachments.name.substring(req.files.attachments.name.lastIndexOf('.') +1).toLowerCase()],
            url: `/api/attachments/delete/${req.body.gameId}`,
            key: req.files.attachments.name
        }],
        'initialPreviewAsData': true
    });
});

router.post('/delete/:gameId', verifyAdminToken, (req, res) => {
    var gameId = req.params.gameId;
    var gamePath = dataProvider.findGamePath(gameId);
    dataProvider.deleteAttachment(games_library, gamePath.path, gameId, req.body.key);
    res.status(200).json({ "success": true });
});