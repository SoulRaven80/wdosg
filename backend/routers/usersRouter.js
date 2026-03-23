import express from 'express';
import { verifyAdminToken, getJWTSecretKey } from '../middleware/userTokenMiddleware.js';
import * as dataProvider from '../providers/dataProvider.js';
import * as crypto from '../crypto/crypto.js';
import * as mailSender from '../email/mailSender.js';
import { logger } from '../logger/logger.js';
import jwt from 'jsonwebtoken';

export const router = express.Router();

router.get('/', verifyAdminToken, (req, res) => {
    res.status(200).json(dataProvider.listUsers());
});

router.post('/add', verifyAdminToken, (req, res) => {
    var user = {};
    user.username = req.body.username;
    user.email = req.body.email;
    user.role = req.body.role;
    user.password = crypto.encrypt(req.body.password);
    try {
        dataProvider.addUser(user);
        res.status(200).json({"success": true});
    }
    catch(err) {
        res.status(500).json({
            status: "failed",
            data: [],
            message: err.message,
        });
    }
});

router.delete('/delete', verifyAdminToken, (req, res) => {
    dataProvider.deleteUser(req.body.username);
    res.status(200).json({"success": true});
});

router.post('/sendInvite', verifyAdminToken, (req, res) => {
    if (!req.body.email || !req.body.role) {
        return res.status(422).send('Invalid invitation information');
    }
    try {
        // validate user already exists
        var user = dataProvider.findUser(req.body.email);
        if (user) {
            return res.status(422).send('User already exists');
        }
        const token = crypto.randomToken();
        dataProvider.addInvitationToken(req.body.email, req.body.role, token);
        mailSender.sendInviteEmail(req.body.email, token).then(() => {
            res.status(200).json({ success: true });
        });
    } catch (err) {
        res.status(500).json({
            status: "error",
            code: 500,
            data: [],
            message: `Internal Server Error while sending email. ${err}`,
        });
    }
});

function addUser(username, email, role, password) {
    try {
        var user = {};
        user.username = username;
        user.email = email;
        user.role = role;
        user.password = crypto.encrypt(password);
        logger.debug(`userrouter: ${user.password}`);
        dataProvider.addUser(user);
    } catch (error) {
        logger.error(`Error while saving new user: ${error}`);
        throw error;
    }
}

router.post('/confirmRegistration', (req, res) => {
    if (!req.body.token || !req.body.email || !req.body.username || !req.body.password) {
        return res.status(422).send('Invalid registration information');
    }
    const userData = dataProvider.findRegistrationToken(req.body.email, req.body.token);
    if (!userData) {
        return res.status(422).send('Invalid invitation link');
    }
    if (Date.parse(userData.expiration) < new Date()) {
        dataProvider.deleteRegistrationToken(req.body.email, req.body.token);
        return res.status(422).send('Expired invitation link, please request a new invitation');
    }
    try {
        addUser(req.body.username, userData.email, userData.role, req.body.password);
        dataProvider.deleteRegistrationToken(req.body.email, req.body.token);
        let options = {
            expiresIn: 120 * 60 * 1000 // would expire in 120 minutes
        };
        const token = jwt.sign({ email: userData.email }, getJWTSecretKey(), options);
        const isAdmin = (userData.role == 'admin');
    
        res.status(200).json({
            status: "success",
            data: { token: token, 
                username: req.body.username, 
                email: userData.email,
                isAdmin: isAdmin
            },
            message: `Welcome ${req.body.username} to wDOSg! You have successfully logged in.`,
        });
    }
    catch(err) {
        res.status(500).json({
            status: "error",
            code: 500,
            data: [],
            message: `Error registering user. ${err}`,
        });
    }
});
