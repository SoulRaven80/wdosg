import express from 'express';
import fileUpload from 'express-fileupload';
import path from 'path';
import cors from 'cors';
import shortuuid from 'short-uuid';
import stringSanitizer from 'string-sanitizer';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import querystring from 'querystring';
import * as dataProvider from './backend/providers/dataProvider.js';
import * as igdbProvider from './backend/providers/igdbProvider.js';
import * as crypto from './backend/crypto/crypto.js';
import * as config from './config.js';
import httpLogger from 'pino-http';
import { logger } from './backend/logger/logger.js';
import * as mailSender from './backend/email/mailSender.js';

if (process.env.TWITCH_CLIENT_ID_FILE) {
    process.env.TWITCH_CLIENT_ID = fs.readFileSync(process.env.TWITCH_CLIENT_ID_FILE, 'utf8').trim();
}
if (process.env.TWITCH_APP_ACCESS_TOKEN_FILE) {
    process.env.TWITCH_APP_ACCESS_TOKEN = fs.readFileSync(process.env.TWITCH_APP_ACCESS_TOKEN_FILE, 'utf8').trim();
}
if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_APP_ACCESS_TOKEN) {
    logger.fatal("IGDB credentials not found. Please set TWITCH_CLIENT_ID and TWITCH_APP_ACCESS_TOKEN as environment variables");
    logger.fatal("following the instructions located at https://api-docs.igdb.com/#account-creation");
    process.exit(1);
}

const games_library = config.getGamesLibraryLocation();
if (process.env.TOKEN_SECRET_FILE) {
    process.env.TOKEN_SECRET = fs.readFileSync(process.env.TOKEN_SECRET_FILE, 'utf8').trim();
}
const jwtSecretKey = process.env.TOKEN_SECRET || 'secret';

const fileTypes = {
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
    'pdf': 'pdf',
    'txt': 'text'
};

// Middleware for JWT validation
const verifyToken = async (req, res, next) => {
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

const verifyAdminToken = async (req, res, next) => {
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

var app = express();
app.use('/', verifyToken);
app.use('/', express.static(path.join(config.getRootPath(), 'public'), { index: 'login.html'}));
app.use('/library', express.static(games_library));
app.disable("x-powered-by");
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

const temporaryDir = './tmp/';

app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : temporaryDir
}));

app.use(httpLogger({ 
    useLevel: 'debug', 
    logger: logger, 
    autoLogging: {
        ignore: (req) => { 
            return (req.url.includes('/css/')
                || req.url.includes('/js/')
                || req.url.includes('/js-dos/'))
        } 
    },
    redact: {
        paths: ['req.headers.cookie'],
        remove: true
    }
}));

const appPort = process.env.PORT || 3001;
app.set('port', appPort);

await mailSender.init(appPort);

app.get('/api/games', verifyToken, async(req, res, next) => {
	var list = await dataProvider.listGames();
    res.status(200).json(list);
});

app.get('/api/gamesShallowInfo', verifyToken, async(req, res, next) => {
	var list = await dataProvider.listGamesShallow();
    res.status(200).json(list);
});

app.get('/api/attachments', verifyAdminToken, async(req, res, next) => {
    var list = await dataProvider.listAttachments(req.query.gameId);
    res.status(200).json(list);
});

app.post('/api/addAttachment', verifyAdminToken, async(req, res, next) => {
    if (!req.files || !req.files.attachments) {
        return res.status(422).send('No files were uploaded');
    }
    await dataProvider.addAttachment(games_library, req.body.gamePath, req.body.gameId, req.files.attachments);
    res.status(200).json({
        'initialPreview': [`/library/${req.body.gamePath}/attachments/${req.files.attachments.name}`],
        'initialPreviewConfig': [{
            caption: req.files.attachments.name,
            filename: req.files.attachments.name,
            type: fileTypes[req.files.attachments.name.substring(req.files.attachments.name.lastIndexOf('.') +1).toLowerCase()],
            url: `/api/deleteAttachment/${req.body.gameId}`,
            key: req.files.attachments.name
        }],
        'initialPreviewAsData': true
    });
});

app.post('/api/deleteAttachment/:gameId', verifyAdminToken, async(req, res, next) => {
    var gameId = req.params.gameId;
    var gamePath = await dataProvider.findGamePath(gameId)
    await dataProvider.deleteAttachment(games_library, gamePath.path, gameId, req.body.key);
    res.status(200).json({ "success": true });
});

app.get('/api/dosZoneGames', verifyAdminToken, async(req, res, next) => {
    const itemsPerPage = 20;
    var page = parseInt(req.query.page) || 1; // Default to page 1 if no page is specified
    const filter = querystring.unescape(req.query.filter) || ''; // Filter keyword from query params
    const genre = querystring.unescape(req.query.genre) || ''; // Filter keyword from query params

    var count = await dataProvider.countDosZoneGames(filter, genre);
    const totalPages = Math.ceil(count / itemsPerPage);
    page = Math.min(page, totalPages);
    const offset = (page - 1) * itemsPerPage;

    var list = await dataProvider.listDosZoneGames(itemsPerPage, offset, filter, genre);

    // Calculate the range of pages to display (limit to 10 page links)
    const rangeSize = 10;
    let startPage = Math.max(1, page - Math.floor(rangeSize / 2));
    let endPage = Math.min(totalPages, startPage + rangeSize - 1);

    // Adjust startPage if we are near the last page
    if (endPage - startPage < rangeSize - 1) {
        startPage = Math.max(1, endPage - rangeSize + 1);
    }
    res.status(200).json({
      currentPage: page,
      totalPages: totalPages,
      startPage: startPage,
      endPage: endPage,
      items: list
    });
});

app.get('/api/dosZoneGenres', verifyAdminToken, async(req, res, next) => {
    var genres = await dataProvider.listDosZoneGenres();
    genres = genres.map(g => g.genre);
    // Some games had multiple genre in the same value. Splitting and filtering
    var filteredGenres = [];
    for (let i = 0; i < genres.length; i++) {
        const genre = genres[i];
        filteredGenres = filteredGenres.concat(genre.split(','));
    }
    res.status(200).json(
        filteredGenres.map(g => g.trim()).sort().filter(function(item, pos, ary) {
            return !pos || item != ary[pos - 1];
        })
    );
});

app.get('/api/getDosZoneGame', verifyAdminToken, async(req, res, next) => {
    const itemsPerPage = 20;
    if (!req.query.id || !parseInt(req.query.id)) {
        return res.status(422).send('Empty or invalid game id');
    }
    var gameId = parseInt(req.query.id);
    var game = await dataProvider.findDosZoneGame(gameId);

    res.status(200).json({
      url: game.url,
      title: game.title,
      id: game.id
    });
});

app.get('/api/game', verifyToken, async(req, res, next) => {
    if (!req.query.gameId) {
        return res.status(422).send('Empty game id');
    }
    res.status(200).json(await dataProvider.findGame(req.query.gameId));
});

app.post('/api/bundle', verifyAdminToken, async(req, res, next) => {
    if (!req.files || !req.files.file) {
        return res.status(422).send('No files were uploaded');
    }
    if (!req.body.gamePath) {
        return res.status(422).send('Empty game path');
    }
    dataProvider.saveGameBundle(games_library, req.body.gamePath, req.files.file);
    res.status(200).json({ "success": true });
});

app.get('/api/gamemetadata', verifyAdminToken, async(req, res, next) => {
    var response;
    try {
        response = await igdbProvider.searchGame(req.query.gameName);
    } catch (error) {
        res.status(500).json(error.message);
    }
    res.status(200).json(response);
});

app.get('/api/companies', verifyToken, async(req, res, next) => {
    res.status(200).json(await dataProvider.listCompanies());
});

app.get('/api/searchCompanies', verifyAdminToken, async(req, res, next) => {
    res.status(200).json(await dataProvider.searchCompanies(req.query.search));
});

app.get('/api/company', verifyToken, async(req, res, next) => {
    res.status(200).json(await dataProvider.findCompany(req.query.companyId));
});

app.get('/api/genres', verifyToken, async(req, res, next) => {
    res.status(200).json(await dataProvider.listGenres());
});

const getDirectories = (source) => {
    return fs.readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
}

app.post('/api/create', verifyAdminToken, async(req, res, next) => {
    if (!req.files || !req.files.file) {
        return res.status(422).send('No files were uploaded');
    }

    var gamePath = stringSanitizer.sanitize.keepNumber(req.body.name);
    logger.debug(`Ensure game does not exist for path ${gamePath}`);
    var dirs = getDirectories(games_library);
    var pathExists = dirs.filter(dir => {
        return dir.toUpperCase() == gamePath.toUpperCase()
    });
    if (pathExists.length > 0) {
        return res.status(403).json({
            status: "failed",
            data: [],
            message: 'Game already exists on library',
        });
    }
    
    var game = getGameFromBody(req.body);
    // these props comes as arrays per form select
    game.developers = req.body.developers;
    game.publishers = req.body.publishers;
    game.genres = req.body.genres;

    logger.debug(`Generating unique game id`);
    game.id = shortuuid.generate();
    logger.debug(`Generating game path`);
    game.path = stringSanitizer.sanitize.keepNumber(game.name);
    await dataProvider.saveNewGame(games_library, req.files.file, game);
    res.status(200).json({ "success": true });
});

app.post('/api/update', verifyAdminToken, async(req, res, next) => {
    var game = getGameFromBody(req.body);
    // these props comes as arrays per form select
    game.developers = req.body.developers;
    game.publishers = req.body.publishers;
    game.genres = req.body.genres;
    game.id = req.body.id;
    
    await dataProvider.updateGame(game);
    res.status(200).redirect('/settings.html?action=updated');
});

app.delete('/api/deleteGame', verifyAdminToken, async(req, res) => {
    await dataProvider.deleteGame(games_library, req.body.gameId);
    res.status(200).json({"success": true});
});

app.get('/api/users', verifyAdminToken, async(req, res, next) => {
    res.status(200).json(await dataProvider.listUsers());
});

async function addUser(username, email, role, password) {
    return new Promise(async (resolve, reject) => {
        try {
            var user = {};
            user.username = username;
            user.email = email;
            user.role = role;
            user.password = await crypto.encrypt(password);
            await dataProvider.addUser(user);
            resolve();
        }
        catch(err) {
            reject(err);
        }
    });
}

app.post('/api/addUser', verifyAdminToken, async(req, res, next) => {
    var user = {};
    user.username = req.body.username;
    user.email = req.body.email;
    user.role = req.body.role;
    user.password = await crypto.encrypt(req.body.password);
    try {
        await dataProvider.addUser(user);
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

app.post('/api/changePassword', verifyToken, async(req, res, next) => {
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

app.delete('/api/deleteUser', verifyAdminToken, async(req, res, next) => {
    await dataProvider.deleteUser(req.body.username);
    res.status(200).json({"success": true});
});

app.post('/api/login', async(req, res, next) => {
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

        let options = {
            expiresIn: 120 * 60 * 1000 // would expire in 120 minutes
        };
        const token = jwt.sign({ email: user.email }, jwtSecretKey, options);
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

function getAuthToken(req) {
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

app.get('/api/logout', async(req, res, next) => {
    await dataProvider.blacklistToken(getAuthToken(req));
    res.status(201).redirect("/login.html");
});

app.get("/home", verifyToken, (req, res, next) => {
    res.status(201).redirect("/index.html");
});

app.post('/api/sendUserInvitation', verifyAdminToken, async(req, res, next) => {
    if (!req.body.email || !req.body.role) {
        return res.status(422).send('Invalid invitation information');
    }
    try {
        // validate user already exists
        var user = await dataProvider.findUser(req.body.email);
        if (user) {
            return res.status(422).send('User already exists');
        }
        const token = crypto.randomToken();
        await dataProvider.addInvitationToken(req.body.email, req.body.role, token);
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

app.post('/api/uploadSaveGame', verifyToken, async(req, res, next) => {
    if (!req.files || !req.files.file) {
        return res.status(422).send('No files were uploaded');
    }
    try {
        dataProvider.appendSavegame(games_library, req.body.gamePath, req.files.file);
    } catch (error) {
        logger.error(`Error trying to store savegames for ${req.body.gamePath}`);
    }
    res.status(200).json({ success: true });
});

app.post('/api/confirmRegistration', async(req, res, next) => {
    if (!req.body.token || !req.body.email || !req.body.username || !req.body.password) {
        return res.status(422).send('Invalid registration information');
    }
    const userData = await dataProvider.findRegistrationToken(req.body.email, req.body.token);
    if (!userData) {
        return res.status(422).send('Invalid invitation link');
    }
    if (Date.parse(userData.expiration) < new Date()) {
        await dataProvider.deleteRegistrationToken(req.body.email, req.body.token);
        return res.status(422).send('Expired invitation link, please request a new invitation');
    }
    addUser(req.body.username, userData.email, userData.role, req.body.password).then(async () => {
        await dataProvider.deleteRegistrationToken(req.body.email, req.body.token);
        let options = {
            expiresIn: 120 * 60 * 1000 // would expire in 120 minutes
        };
        const token = jwt.sign({ email: userData.email }, jwtSecretKey, options);
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
    }).catch((err) => {
        res.status(500).json({
            status: "error",
            code: 500,
            data: [],
            message: `Error registering user. ${err}`,
        });
    });
});

app.post('/api/sendResetPasswordLink', async(req, res, next) => {
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

app.get('/api/startResetPassword', async(req, res, next) => {
    const resetPasswordRequest = await dataProvider.findResetPasswordToken(req.query.email, req.query.token)
    if (!resetPasswordRequest) {
        return res.status(422).send('Invalid reset password link');
    }
    res.status(201).redirect(`/reset-password.html?email=${req.query.email}&token=${req.query.token}`);
});

app.post('/api/resetPassword', async(req, res, next) => {
    const resetPasswordRequest = await dataProvider.findResetPasswordToken(req.body.email, req.body.token)
    if (!resetPasswordRequest) {
        return res.status(422).send('Invalid reset password link');
    }
    await dataProvider.deleteResetPasswordToken(req.body.email, req.body.token);
    await dataProvider.updateUserPassword(req.body.email, req.body.password);
    res.status(200).json({ success: true });
});

const getGameFromBody = (body) => {
    logger.debug(`Parsing request body to build game: ${JSON.stringify(body, null, 2)}`);
    var game = {};
    game.igdb_id = body.igdb_id;
    game.name = body.name;
    game.img = body.img;
    game.description = (body.description ? body.description : '');
    game.year = body.year;
    game.trailer = body.trailer;
    logger.debug(`Built game from body: ${JSON.stringify(game, null, 2)}`);
    return game;
};

dataProvider.init().then(async() => {
    logger.debug(`Clearing up TEMP folder`);
    fs.rmSync(temporaryDir, { recursive: true, force: true });
    dataProvider.runMigrate(games_library).then(() => {
        app.listen(app.get('port'), function(err) {
            if (err) {
                logger.fatal(err, "Error in server setup");
                process.exit(1);
            }
            logger.info(`Application ready. Server listening on port ${app.get('port')}`);
        });
    });
});