import express from 'express';
import { verifyAdminToken } from '../middleware/userTokenMiddleware.js';
import * as dataProvider from '../providers/dataProvider.js';
import * as imageProvider from '../providers/imageProvider.js';
import * as config from '../../config.js';
import fs from 'fs';
import shortuuid from 'short-uuid';
import stringSanitizer from 'string-sanitizer';
import { logger } from '../logger/logger.js';

export const router = express.Router();
const games_library = config.getGamesLibraryLocation();
const rootPath = config.getRootPath();

const getDirectories = (source) => {
    return fs.readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
};

const getGameFromBody = (body) => {
    logger.debug(`Parsing request body to build game: ${JSON.stringify(body, null, 2)}`);
    var game = {};
    game.igdb_id = body.igdb_id;
    game.name = body.name;
    game.description = (body.description ? body.description : '');
    game.year = body.year;
    game.trailer = body.trailer;
    logger.debug(`Built game from body: ${JSON.stringify(game, null, 2)}`);
    return game;
};

router.post('/create', verifyAdminToken, async(req, res) => {
    if (!req.files || !req.files.file) {
        return res.status(422).send('No files were uploaded');
    }

    var gamePath = stringSanitizer.sanitize.keepNumber(req.body.name);
    logger.debug(`Ensure game does not exist for path ${gamePath}`);
    var dirs = getDirectories(games_library);
    var pathExists = dirs.filter(dir => {
        return dir.toUpperCase() == gamePath.toUpperCase();
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
    if (req.body.img) {
        logger.debug(`Downloading image url ${req.body.img}`);
        imageProvider.downloadImage(req.body.img, `${games_library}/${game.path}/metadata/`, 'cover', `${rootPath}public/img/image-not-found.png`);
    }
    else if (fs.existsSync(`${games_library}/TMP/metadata/cover`)) {
        fs.renameSync(`${games_library}/TMP/metadata/cover`, `${games_library}/${game.path}/metadata/cover`);
        fs.rmSync(`${games_library}/TMP`, { recursive: true, force: true });
    }
    else {
        fs.copyFileSync(`${rootPath}public/img/image-not-found.png`, `${games_library}/${game.path}/metadata/cover`);
    }
    res.status(200).json({ "success": true });
});

router.post('/update', verifyAdminToken, async(req, res) => {
    var game = getGameFromBody(req.body);
    // these props comes as arrays per form select
    game.developers = req.body.developers;
    game.publishers = req.body.publishers;
    game.genres = req.body.genres;
    game.id = req.body.id;
    game.path = stringSanitizer.sanitize.keepNumber(game.name);
    await dataProvider.updateGame(game);
    // Ensure there IS a cover
    if (!fs.existsSync(`${games_library}/${game.path}/metadata/cover`)) {
        fs.copyFileSync(`${rootPath}public/img/image-not-found.png`, `${games_library}/${game.path}/metadata/cover`);
    }
    res.status(200).redirect('/settings.html?action=updated');
});

router.delete('/delete', verifyAdminToken, async(req, res) => {
    await dataProvider.deleteGame(games_library, req.body.gameId);
    res.status(200).json({"success": true});
});