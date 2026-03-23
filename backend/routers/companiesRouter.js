import express from 'express';
import apicache from 'apicache';
import { verifyToken, verifyAdminToken } from '../middleware/userTokenMiddleware.js';
import * as dataProvider from '../providers/dataProvider.js';

export const router = express.Router();
const cache = apicache.middleware;

router.get('/', [verifyToken, cache('1 day')], (req, res) => {
    res.status(200).json(dataProvider.listCompanies());
});

router.get('/search', [verifyAdminToken, cache('1 day')], (req, res) => {
    res.status(200).json(dataProvider.searchCompanies(req.query.name));
});
