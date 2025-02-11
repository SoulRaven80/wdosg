import express from 'express';
import * as dataProvider from '../providers/dataProvider.js';
import { getAuthToken } from '../middleware/userTokenMiddleware.js';

export const router = express.Router();

router.get('/', async(req, res) => {
    await dataProvider.blacklistToken(getAuthToken(req));
    res.status(201).redirect("/login.html");
});
