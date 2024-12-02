import fs from 'fs';
import sqlite from "sqlite3";
import os from 'os';
import * as config from '../config.js';

const sqlite3 = sqlite.verbose();
const __dirname = config.getRootPath();

const genresInserts = __dirname + 'sql/genres.sql';
const companiesInserts = __dirname + 'sql/companies.sql';
const dosGamesInserts = __dirname + 'sql/dos-zone-titles.sql';

const ensurePathExists = () => {
  console.log("DB setup: Checking DB path");
  if (!fs.existsSync(config.getDbPath())) {
    console.log("DB setup: DB path does not exist. Creating...");
    fs.mkdirSync(config.getDbPath(), { recursive: true }, (err) => {
      if (err) {
        throw err;
      }
    });
  }
}

const connectDb = async() => {
  return new Promise((resolve, reject) => {
    console.log("DB setup: Opening database");
    let db = new sqlite3.Database(config.getDbPath() + '/database.db', (err) => {
      if (err) {
        return reject(err);
      }
      return resolve(db);
    });
  });
}

const createTables = async() => {
  console.log("DB setup: Creating tables");
  await execute(`CREATE TABLE IF NOT EXISTS genres (
      id text primary key not null,
      name text not null
    );`);
  await execute(`CREATE TABLE IF NOT EXISTS companies (
        id text primary key not null,
        created_at int,
        name text not null,
        slug text
    );`);
  await execute(`CREATE TABLE IF NOT EXISTS games (
        id text not null,
        igdb_id int,
        name text not null,
        img text,
        description text,
        year text,
        trailer text,
        path text not null
    );`);
  await execute(`CREATE TABLE IF NOT EXISTS games_x_genres (
        game_id text not null,
        genre_id text not null
    );`);
  await execute(`CREATE TABLE IF NOT EXISTS games_x_developers (
        game_id text not null,
        company_id text not null
    );`);
  await execute(`CREATE TABLE IF NOT EXISTS games_x_publishers (
        game_id text not null,
        company_id text not null
    );`);
  await execute(`CREATE TABLE IF NOT EXISTS dos_zone_games (
      id int primary key not null,
      title text not null,
      release int null,
      genre text null,
      url text null
    );`);
  await populateTablesIfEmpty();
}

const populateTablesIfEmpty = async() => {
  console.log("DB setup: Checking tables content");
  var countGenres = await fetch(`SELECT count(1) as c FROM genres`);
  if (countGenres.c == 0) {
    console.log("DB setup: Populating genres");
    const genres = fs.readFileSync(genresInserts).toString().split(os.EOL);
    runTransaction(genres);
  }

  var countCompanies = await fetch(`SELECT count(1) as c FROM companies`);
  if (countCompanies.c == 0) {
    console.log("DB setup: Populating companies");
    const companies = fs.readFileSync(companiesInserts).toString().split(os.EOL);
    runTransaction(companies);
  }

  var countDosGames = await fetch(`SELECT count(1) as c FROM dos_zone_games`);
  if (countDosGames.c == 0) {
    console.log("DB setup: Populating dos_games");
    const dosGames = fs.readFileSync(dosGamesInserts).toString().split(os.EOL);
    runTransaction(dosGames);
  }
}

const runTransaction = (data) => {
  db.serialize(() => {
    db.run('BEGIN TRANSACTION;');
    data.forEach((query) => {
      if (query) {
        db.run(query, (err) => {
          if (err) {
            db.run('ROLLBACK;');
            throw err;
          }
        });
      }
    });
    db.run('COMMIT;');
  });
}

export const fetch = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      }
      resolve(rows);
    });
  });
};

export const fetchAll = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      }
      resolve(rows);
    });
  });
};

export const execute = async(sql, params = []) => {
    if (params && params.length > 0) {
      return new Promise((resolve, reject) => {
        db.run(sql, params, (err) => {
          if (err) {
            reject(err);
          }
          resolve();
        });
      });
    }
    return new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
          if (err) {
            reject(err);
          }
          resolve();
      });
    });
};

let db;

export const init = async() => {
  return new Promise(async(resolve, reject) => {
    try {
      ensurePathExists();
      db = await connectDb();
      // db.on('trace', function(query) {
      //   console.log(query);
      // });
      await createTables();
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export default init;