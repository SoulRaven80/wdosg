import * as dbManager from '../data/dbManager.js';
import { logger } from '../logger/logger.js';
import * as config from '../../config.js';
import * as imageProvider from './imageProvider.js';
import fs from 'fs';
import os from 'os';

const template_path = config.getBundleTemplatePath();
const games_library = config.getGamesLibraryLocation();
const root_path = config.getRootPath();

export function runMigrate() {
    const version = dbManager.fetchMigrateVersion();
    logger.debug(`Running Migrate process. Current version: ${version ? JSON.stringify(version, null, 2) : 'NULL'}`);
    if (!version) {
        migrateTo131();
    }
    else {
        const functions = [];
        functions.push(migrateTo131);
        functions.push(migrateTo132);
        functions.push(migrateTo133);
        functions.push(migrateTo135);
        functions.push(migrateTo1310);
        if (version.version_number < functions.length) {
            functions[version.version_number].call();
        }
    }
    logger.debug(`Migrate process updated`);
}

const getSubfolders = source =>
    fs.readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

function migrateTo131() {
    logger.debug(`Running Migrate process v1.3.1`);
    // SETUP dos_zone_table (new installations)
    dbManager.setupDosZoneGamesTable();

    const gamesFolders = getSubfolders(games_library);
    // UPDATE template files into each game folder (v1.3.1)
    for (const folder of gamesFolders) {
        fs.copyFileSync(`${template_path}/game.html`, `${games_library}/${folder}/game.html`);
        fs.copyFileSync(`${template_path}/index.html`, `${games_library}/${folder}/index.html`);
        fs.copyFileSync(`${template_path}/info.json`, `${games_library}/${folder}/info.json`);
    }
    dbManager.updateMigrateVersion(1);
    migrateTo132();
}

function migrateTo132() {
    logger.debug(`Running Migrate process v1.3.2`);
    const gamesFolders = getSubfolders(games_library);
    for (const folder of gamesFolders) {
        fs.copyFileSync(`${template_path}/game.html`, `${games_library}/${folder}/game.html`);
        fs.copyFileSync(`${template_path}/info.json`, `${games_library}/${folder}/info.json`);
    }
    const sqlFile = root_path + 'sql/dos-zone-titles-1.3.2.sql';
    const queries = fs.readFileSync(sqlFile).toString().split(os.EOL);
    dbManager.runTransaction(queries);

    dbManager.updateMigrateVersion(2);
    migrateTo133();
}

function migrateTo133() {
    logger.debug(`Running Migrate process v1.3.3`);
    const gamesFolders = getSubfolders(games_library);
    // Updating latest game.html files
    for (const folder of gamesFolders) {
        fs.copyFileSync(`${template_path}/game.html`, `${games_library}/${folder}/game.html`);
        fs.copyFileSync(`${template_path}/info.json`, `${games_library}/${folder}/info.json`);
    }
    const list = dbManager.listGamesShallow();
    // Updating covers
    for (let i = 0; i < list.length; i++) {
        const game = list[i];
        fs.mkdirSync(`${games_library}/${game.path}/metadata`, { recursive: true });
        if (game.img) {
            logger.debug(`Downloading image url ${game.img}`);
            imageProvider.downloadImage(game.img, `${games_library}/${game.path}/metadata/`, 'cover', `${root_path}public/img/image-not-found.png`);
        }
        else {
            fs.copyFileSync(`${root_path}public/img/image-not-found.png`, `${games_library}/${game.path}/metadata/cover`);
        }
    }
    dbManager.updateMigrateVersion(3);
    migrateTo135();
}

function migrateTo135() {
    logger.debug(`Running Migrate process v1.3.5`);
    const gamesFolders = getSubfolders(games_library);
    // Updating latest game.html files
    for (const folder of gamesFolders) {
        fs.copyFileSync(`${template_path}/index.html`, `${games_library}/${folder}/index.html`);
        fs.copyFileSync(`${template_path}/game.html`, `${games_library}/${folder}/game.html`);
        fs.copyFileSync(`${template_path}/index_v8.html`, `${games_library}/${folder}/index_v8.html`);
        fs.copyFileSync(`${template_path}/game_v8.html`, `${games_library}/${folder}/game_v8.html`);
        fs.copyFileSync(`${template_path}/info.json`, `${games_library}/${folder}/info.json`);
    }
    dbManager.updateMigrateVersion(4);
    migrateTo1310();
}

function migrateTo1310() {
    logger.debug(`Running Migrate process v1.3.10`);
    const sqlFile = root_path + 'sql/dos-zone-titles-1.3.10.sql';
    const queries = fs.readFileSync(sqlFile).toString().split(os.EOL);
    dbManager.runTransaction(queries);
    dbManager.updateMigrateVersion(5);
    // migrateTo1311();
}

export default runMigrate;