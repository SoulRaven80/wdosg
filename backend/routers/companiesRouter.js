import express from 'express';
import apicache from 'apicache';
import { verifyToken, verifyAdminToken } from '../middleware/userTokenMiddleware.js';
import * as dataProvider from '../providers/dataProvider.js';

export const router = express.Router();
const cache = apicache.middleware;

router.get('/', [verifyToken, cache('1 day')], async(req, res) => {
    res.status(200).json(await dataProvider.listCompanies());
});

router.get('/search', [verifyAdminToken, cache('1 day')], async(req, res) => {
    res.status(200).json(await dataProvider.searchCompanies(req.query.name));
});
