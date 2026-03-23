import fs from 'fs';
import * as dbManager from '../data/dbManager.js';
import * as config from '../../config.js';
import { logger } from '../logger/logger.js';
import admZip from 'adm-zip';
import * as migrationProvider from './migrationProvider.js';

const template_path = config.getBundleTemplatePath();

export function listGames() {
    return dbManager.listGames();
}

export function listGamesShallow() {
    return dbManager.listGamesShallow();
}

export function listCompanies() {
    return dbManager.listCompanies();
}

export function listGenres() {
    return dbManager.listGenres();
}

export function searchCompanies(name) {
    return dbManager.searchCompanies(name);
}

export function listAttachments(gameId) {
    var attachments = [];
    var attachmentNames = dbManager.fetchAttachments(gameId);
    for (let i = 0; i < attachmentNames.length; i++) {
        attachments.push({ name: attachmentNames[i].file_name });
    }
    return attachments;
}

export function findGamePath(gameId) {
    return dbManager.fetchGamePath(gameId);
}

export function addAttachment(gamesLibrary, gamePath, gameId, file) {
    fs.mkdirSync(`${gamesLibrary}/${gamePath}/attachments`, { recursive: true });
    file.mv(`${gamesLibrary}/${gamePath}/attachments/${file.name}`);
    return dbManager.addAttachment(gameId, file.name);
}

export function deleteAttachment(gamesLibrary, gamePath, gameId, attachmentName) {
    fs.unlinkSync(`${gamesLibrary}/${gamePath}/attachments/${attachmentName}`);
    return dbManager.deleteAttachment(gameId, attachmentName);
}

export function findGame(gameId) {
    return dbManager.fetchGame(gameId);
}

export function saveGameBundle(gamesLibrary, gamePath, file) {
    logger.debug(`Saving ${gamesLibrary}/${gamePath} bundle file`);
    file.mv(`${gamesLibrary}/${gamePath}/bundle.jsdos`);
}

export function listDosZoneGames(itemsPerPage, offset, searchTerm, genre) {
    return dbManager.listDosZoneGames(itemsPerPage, offset, searchTerm, genre);
}

export function listDosZoneGenres() {
    return dbManager.listDosZoneGenres();
}

export function countDosZoneGames(searchTerm, genre) {
    return dbManager.countDosZoneGames(searchTerm, genre);
}

export function findDosZoneGame(gameId) {
    return dbManager.fetchDosZoneGame(gameId);
}

export function findDosZoneGameByTitle(title) {
    return dbManager.fetchDosZoneGameByTitle(title);
}

export function addDosZoneGame(gameName, year, genres, gameUrl) {
    return dbManager.addDosZoneGame(gameName, year, genres, gameUrl);
}

export function saveNewGame(gamesLibrary, file, game) {
    // TODO Validate if exists, then throw an error
    logger.debug(`Creating ${gamesLibrary}/${game.path} directory`);
    fs.mkdirSync(`${gamesLibrary}/${game.path}/metadata`, { recursive: true });
    logger.debug(`Moving ${file.name} to ${gamesLibrary}/${game.path}/bundle.jsdos`);
    file.mv(`${gamesLibrary}/${game.path}/bundle.jsdos`);
    logger.debug(`Copying templates to ${gamesLibrary}/${game.path}`);
    fs.copyFileSync(`${template_path}/index.html`, `${gamesLibrary}/${game.path}/index.html`);
    fs.copyFileSync(`${template_path}/game.html`, `${gamesLibrary}/${game.path}/game.html`);
    fs.copyFileSync(`${template_path}/index_v8.html`, `${gamesLibrary}/${game.path}/index_v8.html`);
    fs.copyFileSync(`${template_path}/game_v8.html`, `${gamesLibrary}/${game.path}/game_v8.html`);
    fs.copyFileSync(`${template_path}/info.json`, `${gamesLibrary}/${game.path}/info.json`);
    logger.debug(`Saving ${game.name} to DB`);
    return dbManager.saveNewGame(game);
}

export function updateGame(game) {
    return dbManager.updateGame(game);
}

export function deleteGame(gamesLibrary, gameId) {
    return dbManager.deleteGame(gamesLibrary, gameId);
}

export function listUsers() {
    return dbManager.listUsers();
}

export function addUser(user) {
    return dbManager.addUser(user);
}

export function deleteUser(username) {
    return dbManager.deleteUser(username);
}

export function updateUserPassword(email, password) {
    return dbManager.updateUserPassword(email, password);
}

export function findUser(email) {
    return dbManager.findUser(email);
}

export function blacklistToken(token) {
    return dbManager.blacklistToken(token);
}

export function findBlacklistedToken(token) {
    return dbManager.findBlacklistedToken(token);
}

export function addInvitationToken(email, role, token) {
    return dbManager.addInvitationToken(email, role, token);
}

export function findRegistrationToken(email, token) {
    return dbManager.findRegistrationToken(email, token);
}

export function deleteRegistrationToken(email, token) {
    return dbManager.deleteRegistrationToken(email, token);
}

export function addResetPasswordToken(email, token) {
    return dbManager.addResetPasswordToken(email, token);
}

export function findResetPasswordToken(email, token) {
    return dbManager.findResetPasswordToken(email, token);
}

export function deleteResetPasswordToken(email, token) {
    return dbManager.deleteResetPasswordToken(email, token);
}

export function appendSavegame(gamesLibrary, gamePath, file) {
    logger.debug(`Appending save games in ${gamesLibrary}/${gamePath} bundle`);
    const zip = new admZip(file.tempFilePath);
    const bundle = new admZip(`${gamesLibrary}/${gamePath}/bundle.jsdos`);
    for (const zipEntry of zip.getEntries()) {
    // unzip to a tmp folder everything but .jsdos
        if (zipEntry.entryName != '.jsdos/') {
            var decompressedData = zip.readFile(zipEntry);
            bundle.addFile(zipEntry.entryName, decompressedData);
        }
    }
    bundle.writeZip(`${gamesLibrary}/${gamePath}/bundle.jsdos`);
}

export function addCover(gamesLibrary, gamePath, file) {
    fs.mkdirSync(`${gamesLibrary}/${gamePath}/metadata`, { recursive: true });
    file.mv(`${gamesLibrary}/${gamePath}/metadata/cover`);
}

export function runMigrate(gamesLibrary) {
    migrationProvider.runMigrate(gamesLibrary);
}

export function init() {
    return dbManager.init();
}

export default init;