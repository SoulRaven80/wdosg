import express from 'express';
import * as dataProvider from '../providers/dataProvider.js';
import { getAuthToken } from '../middleware/userTokenMiddleware.js';

export const router = express.Router();

router.get('/', (req, res) => {
    dataProvider.blacklistToken(getAuthToken(req));
    res.status(201).redirect("/login.html");
});
