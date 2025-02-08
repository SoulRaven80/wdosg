import express from 'express';
import { verifyToken } from '../middleware/userTokenMiddleware.js';
import * as dataProvider from '../providers/dataProvider.js';
import * as crypto from '../crypto/crypto.js';
import * as mailSender from '../email/mailSender.js';
import { logger } from '../logger/logger.js';

export const router = express.Router();

router.post('/change', verifyToken, async(req, res) => {
    try {
        const user = await dataProvider.findUser(req.body.email);
        if (!user) {
            return res.status(401).json({
                status: "failed",
                data: [],
                message: "Invalid email.",
            });
        }
        const isPasswordValid = await crypto.compare(`${req.body.currentPassword}`, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                status: "failed",
                data: [],
                message: "Incorrect password. Please try again with the correct password.",
            });
        }
        var password = await crypto.encrypt(req.body.newPassword);
        await dataProvider.updateUserPassword(req.body.email, password);
        res.status(200).json({"success": true});
    } catch (err) {
        res.status(500).json({
            status: "error",
            code: 500,
            data: [],
            message: `Internal Server Error. ${err}`,
        });
    }
});

router.post('/sendResetLink', async(req, res) => {
    if (!await dataProvider.findUser(req.body.email)) {
        logger.debug(`No user found under '${req.body.email}' to send Reset Password email`);
    }
    else {
        const token = crypto.randomToken();
        await dataProvider.addResetPasswordToken(req.body.email, token);
        mailSender.sendResetPasswordEmail(req.body.email, token).then(() => {
            logger.debug(`Reset Password email sent to user ${req.body.email}`);
        });
    }
    res.status(200).json({ success: true });
});

router.get('/startReset', async(req, res) => {
    const resetPasswordRequest = await dataProvider.findResetPasswordToken(req.query.email, req.query.token)
    if (!resetPasswordRequest) {
        return res.status(422).send('Invalid reset password link');
    }
    res.status(201).redirect(`/reset-password.html?email=${req.query.email}&token=${req.query.token}`);
});

router.post('/reset', async(req, res) => {
    const resetPasswordRequest = await dataProvider.findResetPasswordToken(req.body.email, req.body.token)
    if (!resetPasswordRequest) {
        return res.status(422).send('Invalid reset password link');
    }
    await dataProvider.deleteResetPasswordToken(req.body.email, req.body.token);
    await dataProvider.updateUserPassword(req.body.email, req.body.password);
    res.status(200).json({ success: true });
});