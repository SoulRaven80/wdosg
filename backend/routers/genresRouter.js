import express from 'express';
import { verifyToken } from '../middleware/userTokenMiddleware.js';
import * as dataProvider from '../providers/dataProvider.js';

export const router = express.Router();

router.get('/', verifyToken, async(req, res) => {
    res.status(200).json(await dataProvider.listGenres());
});
