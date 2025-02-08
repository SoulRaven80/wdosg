import express from 'express';
import fileUpload from 'express-fileupload';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import * as dataProvider from './backend/providers/dataProvider.js';
import * as config from './config.js';
import httpLogger from 'pino-http';
import { logger } from './backend/logger/logger.js';
import * as mailSender from './backend/email/mailSender.js';
import { verifyToken } from './backend/middleware/userTokenMiddleware.js';
import * as gamesRouter from './backend/routers/gamesRouter.js';
import * as attachmentsRouter from './backend/routers/attachmentsRouter.js';
import * as companiesRouter from './backend/routers/companiesRouter.js';
import * as usersRouter from './backend/routers/usersRouter.js';
import * as dosZoneGamesRouter from './backend/routers/dosZoneGamesRouter.js';
import * as passwordRouter from './backend/routers/passwordRouter.js';
import * as gameEntryRouter from './backend/routers/gameEntryRouter.js';
import * as bundlesRouter from './backend/routers/bundlesRouter.js';
import * as loginRouter from './backend/routers/loginRouter.js';
import * as logoutRouter from './backend/routers/logoutRouter.js';
import * as genresRouter from './backend/routers/genresRouter.js';
import * as saveGameRouter from './backend/routers/saveGameRouter.js';

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
const temporaryDir = './tmp/';
const appPort = process.env.PORT || 3001;

var app = express();
app.use('/', verifyToken);
app.use('/', express.static(path.join(config.getRootPath(), 'public'), { index: 'login.html'}));
app.use('/library', express.static(games_library));
app.disable("x-powered-by");
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
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
app.set('port', appPort);

// routers
app.use('/api/games', gamesRouter.router);
app.use('/api/attachments', attachmentsRouter.router);
app.use('/api/companies', companiesRouter.router);
app.use('/api/users', usersRouter.router);
app.use('/api/dosZoneGames', dosZoneGamesRouter.router);
app.use('/api/password', passwordRouter.router);
app.use('/api/gameEntry', gameEntryRouter.router);
app.use('/api/bundles', bundlesRouter.router);
app.use('/api/login', loginRouter.router);
app.use('/api/logout', logoutRouter.router);
app.use('/api/genres', genresRouter.router);
app.use('/api/saveGame', saveGameRouter.router);

app.get("/home", verifyToken, (req, res) => {
    res.status(201).redirect("/index.html");
});

await mailSender.init(appPort);
dataProvider.init().then(() => {
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