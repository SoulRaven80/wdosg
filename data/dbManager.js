import fs from 'fs';
import * as sqlite from './sqlite.js';
import { logger } from '../logger/logger.js';

export async function listGames() {
    logger.debug(`Getting list of games`);
    try {
      var games = await sqlite.fetchAll(`SELECT * FROM games`);
      for (let i = 0; i < games.length; i++) {
        const game = games[i];
        game.genres = await sqlite.fetchAll(`SELECT genre_id as id FROM games_x_genres WHERE game_id = ?;`, [game.id]);
      }
      return games;
    } catch (err) {
      logger.error(err, `Error while getting list of games`);
    }
}

export async function listGamesShallow() {
  logger.debug(`Getting list of games [SHALLOW]`);
  try {
    var games = await sqlite.fetchAll(`SELECT * FROM games`);
    return games;
  } catch (err) {
    logger.error(err, `Error while getting list of games [SHALLOW]`);
  }
}

export async function listDosZoneGames(itemsPerPage, offset, searchTerm) {
  logger.debug(`Getting list of games from DOS-Zone`);
  try {
    var games = await sqlite.fetchAll(`SELECT * FROM dos_zone_games WHERE title LIKE '%${searchTerm}%' LIMIT ${itemsPerPage} OFFSET ${offset}`);
    return games;
  } catch (err) {
    logger.error(err, `Error while getting list of games from DOS-Zone. LIMIT ${itemsPerPage} OFFSET ${offset}`);
  }
}

export async function countDosZoneGames(searchTerm) {
  logger.debug(`Getting count of games from DOS-Zone`);
  try {
    var count = await sqlite.fetch(`SELECT count(1) as c FROM dos_zone_games WHERE title LIKE '%${searchTerm}%'`);
    return count.c;
  } catch (err) {
    logger.error(err, `Error while getting count of games from DOS-Zone`);
  }
}

export async function listCompanies() {
  logger.debug(`Getting list of companies`);
  try {
      return await sqlite.fetchAll(`SELECT * FROM companies`);
  } catch (err) {
    logger.error(err, `Error while getting list of companies`);
  }
}

export async function searchCompanies(searchTerm) {
  logger.debug(`Getting list of companies with name: ${searchTerm}`);
  try {
    return await sqlite.fetchAll(`SELECT * FROM companies WHERE name LIKE ?`, ['%' + searchTerm + '%']);
  } catch (err) {
    logger.error(err, `Error while getting list of games with name: ${searchTerm}`);
  }
}

export async function findCompany(id) {
  logger.debug(`Getting company with id: ${id}`);
  try {
    return await sqlite.fetch(`SELECT * FROM companies WHERE id= ?`, [id]);
  } catch (err) {
    logger.error(err, `Error while getting company with id: ${id}`);
  }
}


export async function listGenres() {
  logger.debug(`Getting list of genres`);
  try {
      return await sqlite.fetchAll(`SELECT * FROM genres`);
  } catch (err) {
    logger.error(err, `Error while getting list of genres`);
  }
}

export async function fetchGame(gameId) {
    logger.debug(`Retrieving game with id: ${gameId}`);
    try {
      const game = await sqlite.fetch(`SELECT * FROM games WHERE id = ?`, [gameId]);
      const genres = await sqlite.fetchAll(`SELECT g.name, g.id FROM games_x_genres gg, genres g WHERE gg.game_id = ? AND gg.genre_id = g.id;`, [gameId]);
      const developers = await sqlite.fetchAll(`SELECT c.name, c.id FROM games_x_developers gd, companies c WHERE gd.game_id = ? AND gd.company_id = c.id;`, [gameId]);
      const publishers = await sqlite.fetchAll(`SELECT c.name, c.id FROM games_x_publishers gp, companies c WHERE gp.game_id = ? AND gp.company_id = c.id;`, [gameId]);
      game.genres = genres;
      game.developers = developers;
      game.publishers = publishers;
      return game;
    } catch (err) {
      logger.error(err, `Error while retrieving game with id: ${gameId}`);
    }
}
export async function fetchDosZoneGame(gameId) {
  logger.debug(`Retrieving game from DOS-Zone with id: ${gameId}`);
  try {
    const game = await sqlite.fetch(`SELECT * FROM dos_zone_games WHERE id = ?`, [gameId]);
    return game;
  } catch (err) {
    logger.error(err, `Error while retrieving game from DOS-Zone with id: ${gameId}`);
  }
}

export async function saveNewGame(game) {
    logger.info(`Saving new game with name: ${game.name}`);
    try {
        await sqlite.execute(`INSERT INTO games(igdb_id,name,img,year,trailer,id,path,description) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [game.igdb_id, game.name, game.img, game.year, game.trailer, game.id, game.path, game.description]);
        if (Array.isArray(game.genres)) {
          for (let i = 0; i < game.genres.length; i++) {
            const genre = game.genres[i];
            await sqlite.execute(`INSERT INTO games_x_genres(game_id,genre_id) VALUES (?, ?)`, [game.id, genre]);
          }
        }
        else if (game.genres) {
          await sqlite.execute(`INSERT INTO games_x_genres(game_id,genre_id) VALUES (?, ?)`, [game.id, game.genres]);
        }
        if (Array.isArray(game.developers)) {
          for (let i = 0; i < game.developers.length; i++) {
            const developer = game.developers[i];
            await sqlite.execute(`INSERT INTO games_x_developers(game_id,company_id) VALUES (?, ?)`, [game.id, developer]);
          }
        }
        else if (game.developers) {
          await sqlite.execute(`INSERT INTO games_x_developers(game_id,company_id) VALUES (?, ?)`, [game.id, game.developers]);
        }
        if (Array.isArray(game.publishers)) {
          for (let i = 0; i < game.publishers.length; i++) {
            const publisher = game.publishers[i];
            await sqlite.execute(`INSERT INTO games_x_publishers(game_id,company_id) VALUES (?, ?)`, [game.id, publisher]);
          }
        }
        else if (game.publishers) {
          await sqlite.execute(`INSERT INTO games_x_publishers(game_id,company_id) VALUES (?, ?)`, [game.id, game.publishers]);
        }
    } catch (err) {
      logger.error(err, `Error while saving new game: ${JSON.stringify(game, null, 2)}`);
    }
}

async function ensureGenreExist(genre) {
  logger.debug(`Ensuring genre exists with id: ${genre}`);
  const dbGenre = await sqlite.fetch(`SELECT * FROM genres where id = ?`, [genre]);
  if (!dbGenre) {
    logger.info(`Genre does not exist. Adding with id: ${genre}`,);
    await sqlite.execute(`INSERT INTO genres(id, name) VALUES (?, ?)`, [genre, genre]);
  }
}

async function ensureDeveloperExist(developer) {
  logger.debug(`Ensuring developer exists with id: ${developer}`);
  const dbDeveloper = await sqlite.fetch(`SELECT * FROM companies where id = ?`, [developer]);
  if (!dbDeveloper) {
    logger.info(`Developer does not exist. Adding with id: ${developer}`,);
    await sqlite.execute(`INSERT INTO companies(id, name) VALUES (?, ?)`, [developer, developer]);
  }
}

async function ensurePublisherExist(publisher) {
  logger.debug(`Ensuring publisher exists with id: ${publisher}`);
  const dbPublisher = await sqlite.fetch(`SELECT * FROM companies where id = ?`, [publisher]);
  if (!dbPublisher) {
    logger.info(`Publisher does not exist. Adding with id: ${publisher}`,);
    await sqlite.execute(`INSERT INTO companies(id, name) VALUES (?, ?)`, [publisher, publisher]);
  }
}

export async function updateGame(game) {
  logger.info(`Updating game: ${game.name}`);
  try {
    await sqlite.execute(`DELETE FROM games_x_genres WHERE game_id = ?`, [game.id]);
    await sqlite.execute(`DELETE FROM games_x_developers WHERE game_id = ?`, [game.id]);
    await sqlite.execute(`DELETE FROM games_x_publishers WHERE game_id = ?`, [game.id]);

    if (game.genres) {
      if (typeof game.genres === 'string') {
        // ensure we add new genres
        await ensureGenreExist(game.genres);
        await sqlite.execute(`INSERT INTO games_x_genres(game_id, genre_id) VALUES (?, ?)`, [game.id, game.genres]);
      }
      else {
        for (let i = 0; i < game.genres.length; i++) {
          const genre = game.genres[i];
          // ensure we add new genres
          await ensureGenreExist(genre);
          await sqlite.execute(`INSERT INTO games_x_genres(game_id, genre_id) VALUES (?, ?)`, [game.id, genre]);
        }
      }
    }
    if (game.developers) {
      if (typeof game.developers === 'string') {
        // ensure we add new developers
        await ensureDeveloperExist(game.developers);
        await sqlite.execute(`INSERT INTO games_x_developers(game_id,company_id) VALUES (?, ?)`, [game.id, game.developers]);
      }
      else {
        for (let i = 0; i < game.developers.length; i++) {
          const developer = game.developers[i];
          // ensure we add new developers
          await ensureDeveloperExist(developer);
          await sqlite.execute(`INSERT INTO games_x_developers(game_id,company_id) VALUES (?, ?)`, [game.id, developer]);
        }
      }
    }
    if (game.publishers) {
      if (typeof game.publishers === 'string') {
        // ensure we add new publishers
        await ensurePublisherExist(game.publishers);
        await sqlite.execute(`INSERT INTO games_x_publishers(game_id,company_id) VALUES (?, ?)`, [game.id, game.publishers]);
      }
      else {
        for (let i = 0; i < game.publishers.length; i++) {
          const publisher = game.publishers[i];
          // ensure we add new publishers
          await ensurePublisherExist(publisher);
          await sqlite.execute(`INSERT INTO games_x_publishers(game_id,company_id) VALUES (?, ?)`, [game.id, publisher]);
        }
      }
    }

    await sqlite.execute(`UPDATE games SET igdb_id = ?, name = ?, img = ?, year = ?, trailer = ?, description = ? WHERE id = ?`,
        [game.igdb_id, game.name, game.img, game.year, game.trailer, game.description, game.id]);
  } catch (err) {
    logger.error(err, `Error while updating game: ${game.name}`);
  }
}

export async function deleteGame(gamesLibrary, gameId) {
  logger.info(`Deleting game with id: ${gameId}`);
  try {
    const game = await fetchGame(gameId);
    await sqlite.execute(`DELETE FROM games_x_genres WHERE game_id = ?`, [gameId]);
    await sqlite.execute(`DELETE FROM games_x_developers WHERE game_id = ?`, [gameId]);
    await sqlite.execute(`DELETE FROM games_x_publishers WHERE game_id = ?`, [gameId]);
    await sqlite.execute(`DELETE FROM games WHERE id = ?`, [gameId]);
    logger.debug(`Deleting library entry path: ${gamesLibrary}/${game.path}`);
    fs.rmSync(`${gamesLibrary}/${game.path}`, { recursive: true, force: true });
  } catch (err) {
    logger.error(err, `Error while deleting game with id: ${game.id}`);
  }
}

export async function init() {
  return sqlite.init();
}

export default init;