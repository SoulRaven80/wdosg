import fs from 'fs';
import * as dbManager from '../data/dbManager.js';
import * as config from '../config.js';
import { logger } from '../logger/logger.js';

const template_path = config.getBundleTemplatePath();

export async function listGames() {
  return await dbManager.listGames();
}

export async function listGamesShallow() {
  return await dbManager.listGamesShallow();
}

export async function listCompanies() {
  return await dbManager.listCompanies();
}

export async function listGenres() {
  return await dbManager.listGenres();
}

export async function searchCompanies(searchTerm) {
  return await dbManager.searchCompanies(searchTerm);
}

export async function findCompany(id) {
  return await dbManager.findCompany(id);
}

export async function listAttachments(gameId) {
  var attachments = [];
  var attachmentNames = await dbManager.fetchAttachments(gameId);
  for (let i = 0; i < attachmentNames.length; i++) {
    attachments.push({ name: attachmentNames[i].file_name });
  }
  return attachments;
}

export async function findGamePath(gameId) {
  return await dbManager.fetchGamePath(gameId);
}

export async function addAttachment(gamesLibrary, gamePath, gameId, file) {
  fs.mkdirSync(`${gamesLibrary}/${gamePath}/attachments`, { recursive: true });
  file.mv(`${gamesLibrary}/${gamePath}/attachments/${file.name}`);
  return await dbManager.addAttachment(gameId, file.name);
}

export async function deleteAttachment(gamesLibrary, gamePath, gameId, attachmentName) {
  fs.unlinkSync(`${gamesLibrary}/${gamePath}/attachments/${attachmentName}`);
  return await dbManager.deleteAttachment(gameId, attachmentName);
}

export async function findGame(gameId) {
  return await dbManager.fetchGame(gameId);
}

export async function listDosZoneGames(itemsPerPage, offset, searchTerm, genre) {
  return await dbManager.listDosZoneGames(itemsPerPage, offset, searchTerm, genre);
}

export async function listDosZoneGenres() {
  return await dbManager.listDosZoneGenres();
}

export async function countDosZoneGames(searchTerm, genre) {
  return await dbManager.countDosZoneGames(searchTerm, genre);
}

export async function findDosZoneGame(gameId) {
  return await dbManager.fetchDosZoneGame(gameId);
}

export async function saveNewGame(gamesLibrary, file, game) {
  // TODO Validate if exists, then throw an error
  logger.debug(`Creating ${gamesLibrary}/${game.path} directory`);
  fs.mkdirSync(`${gamesLibrary}/${game.path}`, { recursive: true });
  logger.debug(`Moving ${file.name} to ${gamesLibrary}/${game.path}/bundle.jsdos`);
  file.mv(`${gamesLibrary}/${game.path}/bundle.jsdos`);
  logger.debug(`Copying templates to ${gamesLibrary}/${game.path}`);
  fs.copyFileSync(`${template_path}/index.html`, `${gamesLibrary}/${game.path}/index.html`);
  fs.copyFileSync(`${template_path}/game.html`, `${gamesLibrary}/${game.path}/game.html`);
  logger.debug(`Saving ${game.name} to DB`);
  return await dbManager.saveNewGame(game);
}

export async function updateGame(game) {
  return await dbManager.updateGame(game);
}

export async function deleteGame(gamesLibrary, gameId) {
  return await dbManager.deleteGame(gamesLibrary, gameId);
}

export async function listUsers() {
  return await dbManager.listUsers();
}

export async function addUser(user) {
  return await dbManager.addUser(user);
}

export async function deleteUser(username) {
  return await dbManager.deleteUser(username);
}

export async function updateUserPassword(email, password) {
  return await dbManager.updateUserPassword(email, password);
}

export async function findUser(email) {
  return await dbManager.findUser(email);
}

export async function blacklistToken(token) {
  return await dbManager.blacklistToken(token);
}

export async function findBlacklistedToken(token) {
  return await dbManager.findBlacklistedToken(token);
}

export async function init() {
  return dbManager.init();
}

export default init;