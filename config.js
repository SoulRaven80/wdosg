import * as url from 'url';
import path from 'path';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, '/database');
const libPath = process.env.GAMES_LIBRARY || path.join(__dirname, './wdosglibrary');

export function getRootPath() {
    return __dirname;
}

export function getBundleTemplatePath() {
    return __dirname + '/bundle_template';
}

export function getDbPath() {
    return dbPath;
}

export function getGamesLibraryLocation() {
    return libPath;
}
