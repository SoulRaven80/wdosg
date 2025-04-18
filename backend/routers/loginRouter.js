import express from 'express';
import * as dataProvider from '../providers/dataProvider.js';
import * as crypto from '../crypto/crypto.js';
import jwt from 'jsonwebtoken';
import { getJWTSecretKey } from '../middleware/userTokenMiddleware.js';

export const router = express.Router();

router.post('/', async(req, res) => {
    try {
        const user = await dataProvider.findUser(req.body.email);
        if (!user) {
            return res.status(401).json({
                status: "failed",
                data: [],
                message: "Invalid email or password. Please try again with the correct credentials.",
            });
        }
        const isPasswordValid = await crypto.compare(`${req.body.password}`, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                status: "failed",
                data: [],
                message: "Invalid email or password. Please try again with the correct credentials.",
            });
        }

        const token = jwt.sign({ email: user.email }, getJWTSecretKey());
        const isAdmin = (user && user.role == 'admin');
    
        res.status(200).json({
            status: "success",
            data: { token: token, 
                username: user.username, 
                email: user.email,
                isAdmin: isAdmin
            },
            message: "You have successfully logged in.",
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            code: 500,
            data: [],
            message: `Internal Server Error. ${err}`,
        });
    }
});
