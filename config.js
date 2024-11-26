import * as url from 'url';
import path from 'path';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export function getRootPath() {
    return __dirname;
}

export function getBundleTemplatePath() {
    return __dirname + '/bundle_template';
}

export function getDbPath() {
    return process.env.DB_PATH || path.join(__dirname, '/database');
}

export function getGamesLibraryLocation() {
    return process.env.GAMES_LIBRARY || path.join(__dirname, '/app/wdosglibrary');
}
