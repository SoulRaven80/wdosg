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
import { verifyAdminToken, verifyToken } from './backend/middleware/userTokenMiddleware.js';
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
import * as coversRouter from './backend/routers/coversRouter.js';

if (process.env.TWITCH_APP_ACCESS_TOKEN_FILE || process.env.TWITCH_APP_ACCESS_TOKEN) {
    logger.warn("TWITCH_APP_ACCESS_TOKEN & TWITCH_APP_ACCESS_TOKEN_FILE environment vars are deprecated since v1.3.5.");
    logger.warn("Make sure your wDOSg instance is configured with TWITCH_CLIENT_SECRET or TWITCH_CLIENT_SECRET_FILE environment variables instead");
}
if (process.env.TWITCH_CLIENT_ID_FILE) {
    process.env.TWITCH_CLIENT_ID = fs.readFileSync(process.env.TWITCH_CLIENT_ID_FILE, 'utf8').trim();
}
if (process.env.TWITCH_CLIENT_SECRET_FILE) {
    process.env.TWITCH_CLIENT_SECRET = fs.readFileSync(process.env.TWITCH_CLIENT_SECRET_FILE, 'utf8').trim();
}

if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
    logger.fatal("IGDB credentials not found. Please set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET as environment variables or docker secrets (if applicable)");
    logger.fatal("following the instructions located at https://api-docs.igdb.com/#account-creation");
    process.exit(1);
}

const games_library = config.getGamesLibraryLocation();
const temporaryDir = './tmp/';
const appPort = process.env.PORT || 3001;

var app = express();
app.use("/settings*", verifyAdminToken, (req, res, next) => {
    next();
});
app.use('/', [verifyToken, express.static(path.join(config.getRootPath(), 'public'), { index: '/home' })]);
app.use('/library', [verifyToken, express.static(games_library)]);
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
                || req.url.includes('/js-dos/'));
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
app.use('/api/covers', coversRouter.router);

app.get("/home", verifyToken, (req, res) => {
    res.status(201).redirect("/index.html");
});

app.get("/", verifyToken, (req, res) => {
    res.status(201).redirect("/index.html");
});

await mailSender.init(appPort);
dataProvider.init().then(() => {
    logger.debug(`Clearing up TEMP folder`);
    fs.rmSync(temporaryDir, { recursive: true, force: true });

    dataProvider.runMigrate(games_library).then(async() => {
        try {
            await updateDosZoneGameList();
        } catch (error) {
            logger.warn(`Error while trying to update DOSZone games list. Error: ${error}`);
        }
        finally {
            app.listen(app.get('port'), function(err) {
                if (err) {
                    logger.fatal(err, "Error in server setup");
                    process.exit(1);
                }
                logger.info(`Application ready. Server listening on port ${app.get('port')}`);
            });
        }
    });
});

/* extact list of games from fuzzy-index
    find new (unstored games)
    for each unstored games
        | fetch metadata from IGDB
        | store it into dosZoneGames database table
*/
const updateDosZoneGameList = async () => {
   const gameList = await dosZoneGamesRouter.fetchGameList();
    for (let i = 0; i < gameList.length; i++) {
        const item = gameList[i];
        const storedGame = await dosZoneGamesRouter.findDosZoneGameByTitle(item.k.target);
        if (!storedGame) {
            try {
                const gameData = await dosZoneGamesRouter.findDosZoneGameData(item);
                if (gameData) {
                    await dosZoneGamesRouter.addDosZoneGame(gameData.gameName, gameData.year, gameData.genres, gameData.url);
                }
            } catch (error) {
                logger.error(`Skipping DosZone game data with path ${item.v} processing. Error message: ${error.message}`);
            }
        }
    }
}
