import * as url from 'url';
import path from 'path';
import { logger } from './backend/logger/logger.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, '/database');
const libPath = process.env.GAMES_LIBRARY || path.join(__dirname, './wdosglibrary');

export function getRootPath() {
    logger.trace(`getRootPath(): ${__dirname}`);
    return __dirname;
}

export function getBundleTemplatePath() {
    logger.trace(`getBundleTemplatePath(): ${__dirname + '/bundle_template'}`);
    return __dirname + '/bundle_template';
}

export function getDbPath() {
    logger.trace(`getDbPath(): ${dbPath}`);
    return dbPath;
}

export function getGamesLibraryLocation() {
    logger.trace(`getGamesLibraryLocation(): ${libPath}`);
    return libPath;
}
