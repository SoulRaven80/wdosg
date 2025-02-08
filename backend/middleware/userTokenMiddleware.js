import * as dataProvider from '../providers/dataProvider.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';

if (process.env.TOKEN_SECRET_FILE) {
    process.env.TOKEN_SECRET = fs.readFileSync(process.env.TOKEN_SECRET_FILE, 'utf8').trim();
}
const jwtSecretKey = process.env.TOKEN_SECRET || 'secret';

// Middleware for JWT validation
export const verifyToken = async (req, res, next) => {
    var comesFrom = req.originalUrl && ['/login.html', '/', '/api/login', '/finish-registration.html']
        .some(url => req.originalUrl.includes(url));
    var refererFrom = req.headers.referer &&
        ['/login.html', '/', '/api/login', '/finish-registration.html']
        .some(url => req.headers.referer.includes(url));
    if (comesFrom || refererFrom) {
        next();
        return;
    }
    var token = getAuthToken(req);
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // check db blacklist
    var result = await dataProvider.findBlacklistedToken(token);
    if (result) {
        return res.status(401).json({ error: 'Session expired' });
    }

    jwt.verify(token, jwtSecretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        req.user = decoded;
        next();
    });
};

export const verifyAdminToken = async (req, res, next) => {
    var token = getAuthToken(req);
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // check db blacklist
    var result = await dataProvider.findBlacklistedToken(token);
    if (result) {
        return res.status(401).json({ error: 'Session expired' });
    }

    jwt.verify(token, jwtSecretKey, async(err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        req.user = decoded;
        const user = await dataProvider.findUser(req.user.email);
        const isAdmin = { isAdmin: (user && user.role == 'admin') };
        if (!isAdmin) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        next();
    });
};

export const getAuthToken = (req) => {
    const cookieStr = req.headers.cookie;
    if (cookieStr) {
        let cookies = cookieStr.split("; ");
        for (let i = 0; i < cookies.length; i++) {
            const element = cookies[i];
            if (element.startsWith('auth-token=')) {
                return element.split("=")[1];
            }
        }
    }
    return;
}

export const getJWTSecretKey = () => {
    return jwtSecretKey;
}
