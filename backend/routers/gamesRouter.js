import express from 'express';
import { verifyToken, verifyAdminToken } from '../middleware/userTokenMiddleware.js';
import * as dataProvider from '../providers/dataProvider.js';
import * as igdbProvider from '../providers/igdbProvider.js';

export const router = express.Router();

router.get('/', verifyToken, async(req, res) => {
    var list = await dataProvider.listGames();
    res.status(200).json(list);
});

router.get('/shallowInfo', verifyToken, async(req, res) => {
    var list = await dataProvider.listGamesShallow();
    res.status(200).json(list);
});

router.get('/find', verifyToken, async(req, res) => {
    if (!req.query.gameId) {
        return res.status(422).send('Empty game id');
    }
    res.status(200).json(await dataProvider.findGame(req.query.gameId));
});

router.get('/metadata', verifyAdminToken, async(req, res) => {
    var response;
    try {
        response = await fetchMetadata(req.query.gameName);
    } catch (error) {
        res.status(500).json(error.message);
    }
    res.status(200).json(response);
});

export async function fetchMetadata(gameName) {
    return await igdbProvider.searchGame(gameName);
}