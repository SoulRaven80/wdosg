import fs from 'fs';
import * as sqlite from './sqlite.js';

export async function listGames() {
    try {
      var games = await sqlite.fetchAll(`SELECT * FROM games`);
      for (let i = 0; i < games.length; i++) {
        const game = games[i];
        game.genres = await sqlite.fetchAll(`SELECT genre_id as id FROM games_x_genres WHERE game_id = ?;`, [game.id]);
      }
      return games;
    } catch (err) {
        console.log(err);
    }
}

export async function listCompanies() {
  try {
      return await sqlite.fetchAll(`SELECT * FROM companies`);
  } catch (err) {
      console.log(err);
  }
}

export async function searchCompanies(searchTerm) {
  try {
    return await sqlite.fetchAll(`SELECT * FROM companies WHERE name LIKE ?`, ['%' + searchTerm + '%']);
  } catch (err) {
      console.log(err);
  }
}

export async function findCompany(id) {
  try {
    return await sqlite.fetch(`SELECT * FROM companies WHERE id= ?`, [id]);
  } catch (err) {
      console.log(err);
  }
}


export async function listGenres() {
  try {
      return await sqlite.fetchAll(`SELECT * FROM genres`);
  } catch (err) {
      console.log(err);
  }
}

export async function fetchGame(gameId) {
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
        console.log(err);
    }
}

export async function saveNewGame(game) {
    try {
        console.log(`Saving new game: ${game.name}`);
        await sqlite.execute(`INSERT INTO games(igdb_id,name,img,year,trailer,id,path,description) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [game.igdb_id, game.name, game.img, game.year, game.trailer, game.id, game.path, game.description]);
        for (let i = 0; i < game.genres.length; i++) {
          const genre = game.genres[i];
          await sqlite.execute(`INSERT INTO games_x_genres(game_id,genre_id) VALUES (?, ?)`, [game.id, genre]);
        }
        for (let i = 0; i < game.developers.length; i++) {
          const developer = game.developers[i];
          await sqlite.execute(`INSERT INTO games_x_developers(game_id,company_id) VALUES (?, ?)`, [game.id, developer]);
        }
        for (let i = 0; i < game.publishers.length; i++) {
          const publisher = game.publishers[i];
          await sqlite.execute(`INSERT INTO games_x_publishers(game_id,company_id) VALUES (?, ?)`, [game.id, publisher]);
        }
    } catch (err) {
      console.error(err);
    }
}

async function ensureGenreExist(genre) {
  const dbGenre = await sqlite.fetch(`SELECT * FROM genres where id = ?`, [genre]);
  if (!dbGenre) {
    console.log(`Adding new Genre: ${genre}`,);
    await sqlite.execute(`INSERT INTO genres(id, name) VALUES (?, ?)`, [genre, genre]);
  }
}

async function ensureDeveloperExist(developer) {
  const dbDeveloper = await sqlite.fetch(`SELECT * FROM companies where id = ?`, [developer]);
  if (!dbDeveloper) {
    console.log(`Adding new Developer: ${developer}`,);
    await sqlite.execute(`INSERT INTO companies(id, name) VALUES (?, ?)`, [developer, developer]);
  }
}

async function ensurePublisherExist(publisher) {
  const dbPublisher = await sqlite.fetch(`SELECT * FROM companies where id = ?`, [publisher]);
  if (!dbPublisher) {
    console.log(`Adding new Publisher: ${publisher}`,);
    await sqlite.execute(`INSERT INTO companies(id, name) VALUES (?, ?)`, [publisher, publisher]);
  }
}

export async function updateGame(game) {
  console.log(`Updating game: ${game.name}`);
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
    console.error(err);
  }
}

export async function deleteGame(gamesLibrary, gameId) {
  console.log(`Deleting game: ${gameId}`);
  try {
    const game = await fetchGame(gameId);
    await sqlite.execute(`DELETE FROM games_x_genres WHERE game_id = ?`, [gameId]);
    await sqlite.execute(`DELETE FROM games_x_developers WHERE game_id = ?`, [gameId]);
    await sqlite.execute(`DELETE FROM games_x_publishers WHERE game_id = ?`, [gameId]);
    await sqlite.execute(`DELETE FROM games WHERE id = ?`, [gameId]);
    fs.rmSync(`${gamesLibrary}/${game.path}`, { recursive: true, force: true });
  } catch (err) {
    console.error(err);
  }
}

export async function init() {
  return sqlite.init();
}

export default init;