import * as dbManager from '../data/dbManager.js';
import { logger } from '../logger/logger.js';
import * as config from '../../config.js';
import fs from 'fs';

const template_path = config.getBundleTemplatePath();
const games_library = config.getGamesLibraryLocation();

export async function runMigrate() {
  const version = await dbManager.fetchMigrateVersion();
  if (!version) {
    await migrateTo131();
  }
  else {
    const functions = [];
    functions.push(migrateTo131);
    functions.push(migrateTo132);
    // functions.push(migrateTo3);
    if (version.version_number < functions.length) {
        await functions[version.version_number].call(); //.call(this, param);
    }
  }
  logger.debug(`Migrate process updated`);
}

const getSubfolders = source =>
  fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

async function migrateTo131() {
  logger.debug(`Running Migrate process v1.3.1`);
  // SETUP dos_zone_table (new installations)
  await dbManager.setupDosZoneGamesTable();

  const gamesFolders = getSubfolders(games_library);
  // UPDATE template files into each game folder (v1.3.1)
  for (const folder of gamesFolders) {
    fs.copyFileSync(`${template_path}/game.html`, `${games_library}/${folder}/game.html`);
    fs.copyFileSync(`${template_path}/index.html`, `${games_library}/${folder}/index.html`);
    fs.copyFileSync(`${template_path}/info.json`, `${games_library}/${folder}/info.json`);
  }
  await dbManager.updateMigrateVersion(1);
  await migrateTo132();
}

async function migrateTo132() {
  logger.debug(`Running Migrate process v1.3.2`);
  const gamesFolders = getSubfolders(games_library);
  for (const folder of gamesFolders) {
    fs.copyFileSync(`${template_path}/game.html`, `${games_library}/${folder}/game.html`);
    fs.copyFileSync(`${template_path}/info.json`, `${games_library}/${folder}/info.json`);
  }
  await dbManager.updateMigrateVersion(2);
  // await migrateTo3();
}
/*
examples
async function migrateTo3() {
  logger.debug(`migrate 3`);
  logger.debug();
  await dbManager.updateMigrateVersion(3);
}
*/
export default runMigrate;