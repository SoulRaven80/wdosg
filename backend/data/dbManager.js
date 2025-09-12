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

export async function listDosZoneGames(itemsPerPage, offset, searchTerm, genre) {
    logger.debug(`Getting list of games from DOS-Zone`);
    try {
        var sql = `SELECT * FROM dos_zone_games WHERE title LIKE '%${searchTerm}%'`;
        if (genre) {
            sql += ` AND genre LIKE '%${genre.replaceAll("'", "''")}%'`;
        }
        sql += ` LIMIT ${itemsPerPage} OFFSET ${offset}`;
        var games = await sqlite.fetchAll(sql);
        return games;
    } catch (err) {
        logger.error(err, `Error while getting list of games from DOS-Zone. LIMIT ${itemsPerPage} OFFSET ${offset}`);
    }
}

export async function countDosZoneGames(searchTerm, genre) {
    logger.debug(`Getting count of games from DOS-Zone`);
    try {
        var sql = `SELECT count(1) as c FROM dos_zone_games WHERE title LIKE '%${searchTerm}%'`;
        if (genre) {
            sql += ` AND genre LIKE '%${genre.replaceAll("'", "''")}%'`;
        }
        var count = await sqlite.fetch(sql);
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

export async function searchCompanies(name) {
    logger.debug(`Getting list of companies with name: ${name}`);
    try {
        return await sqlite.fetchAll(`SELECT * FROM companies WHERE name LIKE ?`, [`%${name}%`]);
    } catch (err) {
        logger.error(err, `Error while getting list of games with name: ${name}`);
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

export async function listDosZoneGenres() {
    logger.debug(`Getting list of DOS-Zone genres`);
    try {
        return await sqlite.fetchAll(`SELECT DISTINCT genre FROM dos_zone_games;`);
    } catch (err) {
        logger.error(err, `Error while getting list of DOS-Zone genres`);
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

export async function fetchGamePath(gameId) {
    logger.debug(`Retrieving game path with id: ${gameId}`);
    try {
        return await sqlite.fetch(`SELECT path FROM games WHERE id = ?`, [gameId]);
    } catch (err) {
        logger.error(err, `Error while retrieving game path with id: ${gameId}`);
    }
}

export async function fetchAttachments(gameId) {
    logger.debug(`Retrieving attachments for game with id: ${gameId}`);
    try {
        const attachments = await sqlite.fetchAll(`SELECT * FROM game_attachments WHERE game_id = ?`, [gameId]);
        return attachments;
    } catch (err) {
        logger.error(err, `Error while retrieving attachments for game with id: ${gameId}`);
    }
}

export async function addAttachment(gameId, attachmentName) {
    logger.debug(`Adding attachment ${attachmentName} for game with id: ${gameId}`);
    try {
        await sqlite.execute(`INSERT INTO game_attachments(game_id, file_name) VALUES (?, ?)`,
            [gameId, attachmentName]);
    } catch (err) {
        logger.error(err, `Error while adding attachment for game with id: ${gameId}`);
        throw err;
    }
}

export async function deleteAttachment(gameId, attachmentName) {
    logger.debug(`Deleting attachment ${attachmentName} for game with id: ${gameId}`);
    try {
        await sqlite.execute(`DELETE FROM game_attachments WHERE game_id = ? AND file_name = ?`, [gameId, attachmentName]);
    } catch (err) {
        logger.error(err, `Error while deleting attachment for game with id: ${gameId}`);
        throw err;
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

export async function fetchDosZoneGameByTitle(gameTitle) {
    logger.debug(`Retrieving game from dos_zone_games table with title: ${gameTitle}`);
    try {
        const game = await sqlite.fetch(`SELECT * FROM dos_zone_games WHERE title = ?`, [gameTitle]);
        return game;
    } catch (err) {
        logger.error(err, `Error while retrieving game from DOS-Zone with title: ${gameTitle}`);
    }
}

export async function addDosZoneGame(gameName, year, genres, gameUrl) {
    logger.debug(`Adding new game to dos_zone_games table with title ${gameName}`);
    try {
        const res = await sqlite.fetch(`SELECT MAX(id) as max FROM dos_zone_games`);
        await sqlite.execute(`INSERT INTO dos_zone_games(id,title,release,genre,url) VALUES (?, ?, ?, ?, ?)`,
            [(res.max + 1), gameName, year, genres, gameUrl]);
    } catch (err) {
        logger.error(err, `Error while adding new DosZone game with title: ${gameName}`);
        throw err;
    }
}

export async function saveNewGame(game) {
    logger.info(`Saving new game with name: ${game.name}`);
    try {
        await sqlite.execute(`INSERT INTO games(igdb_id,name,year,trailer,id,path,description)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [game.igdb_id, game.name, game.year, game.trailer, game.id, game.path, game.description]);
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

        await sqlite.execute(`UPDATE games SET igdb_id = ?, name = ?, year = ?, trailer = ?, description = ? WHERE id = ?`,
            [game.igdb_id, game.name, game.year, game.trailer, game.description, game.id]);
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
        logger.error(err, `Error while deleting game with id: ${gameId}`);
    }
}

export async function listUsers() {
    logger.debug(`Getting list of users`);
    try {
        return await sqlite.fetchAll(`SELECT * FROM users`);
    } catch (err) {
        logger.error(err, `Error while getting list of users`);
    }
}

export async function addUser(user) {
    logger.info(`Creating new user: ${user.username}`,);
    await ensureUniqueUser(user);
    try {
        await sqlite.execute(`INSERT INTO users (username,email,role,password) VALUES (?, ?, ?, ?)`, [user.username, user.email, user.role, user.password]);
    } catch (err) {
        logger.error(err, `Error while saving user`);
        throw err;
    }
}

export async function deleteUser(username) {
    logger.info(`Deleting user with username: ${username}`);
    try {
        await sqlite.execute(`DELETE FROM users WHERE username = ?`, [username]);
    } catch (err) {
        logger.error(err, `Error while deleting user with username: ${username}`);
        throw err;
    }
}

export async function updateUserPassword(email, password) {
    logger.info(`Updating password for user with email: ${email}`);
    try {
        await sqlite.execute(`UPDATE users SET password = ? WHERE email = ?`, [password, email]);
    } catch (err) {
        logger.error(err, `Error while updating user with email: ${email}`);
        throw err;
    }
}

async function ensureUniqueUser(user) {
    logger.debug(`Ensuring user does not exist with username: ${user.username} and email: ${user.email}`);
    const dbUser = await sqlite.fetch(`SELECT * FROM users where username = ? OR email = ?`, [user.username, user.email]);
    if (dbUser) {
        logger.error(`User already exists`);
        throw new Error(`User already exists`);
    }
}

export async function findUser(email) {
    logger.debug(`Retrieving user with email: ${email}`);
    try {
        const user = await sqlite.fetch(`SELECT * FROM users WHERE email = ?`, [email]);
        return user;
    } catch (err) {
        logger.error(err, `Error while retrieving user with email: ${email}`);
    }
}

export async function blacklistToken(token) {
    logger.info(`Invalidating token`);
    try {
        return await sqlite.execute(`INSERT INTO tokens_blacklist(token) VALUES (?)`, [token]);
    } catch (err) {
        logger.error(err, `Error while blacklisting token`);
    }
}

export async function findBlacklistedToken(token) {
    return await sqlite.fetch(`SELECT * FROM tokens_blacklist WHERE token = ?`, [token]);
}

export async function addInvitationToken(email, role, token) {
    logger.info(`Adding invite token for user ${email}`);
    var expDate = new Date();
    expDate.setDate(expDate.getUTCDate() + 1);
    var formattedDate = expDate.toISOString();
    formattedDate = formattedDate.substring(0, formattedDate.indexOf('.'));
    return await sqlite.execute(`INSERT INTO invitation_tokens(email, role, expiration, token) VALUES (?, ?, ?, ?)`, [email, role, formattedDate, token]);
}

export async function findRegistrationToken(email, token) {
    return await sqlite.fetch(`SELECT * FROM invitation_tokens WHERE email = ? AND token = ?`, [email, token]);
}

export async function deleteRegistrationToken(email, token) {
    await sqlite.execute(`DELETE FROM invitation_tokens WHERE email = ? AND token = ?`, [email, token]);
}

export async function addResetPasswordToken(email, token) {
    logger.info(`Adding Reset Password token for user ${email}`);
    return await sqlite.execute(`INSERT INTO reset_password_tokens(email, token) VALUES (?, ?)`, [email, token]);
}

export async function findResetPasswordToken(email, token) {
    return await sqlite.fetch(`SELECT * FROM reset_password_tokens WHERE email = ? AND token = ?`, [email, token]);
}

export async function deleteResetPasswordToken(email, token) {
    await sqlite.execute(`DELETE FROM reset_password_tokens WHERE email = ? AND token = ?`, [email, token]);
}

export async function fetchMigrateVersion() {
    return await sqlite.fetch(`SELECT * FROM migrate_version`);
}

export async function updateMigrateVersion(version) {
    await sqlite.execute(`DELETE FROM migrate_version`);
    await sqlite.execute(`INSERT INTO migrate_version(version_number) VALUES (?)`, [version]);
}

export async function setupDosZoneGamesTable() {
    const res = await sqlite.fetch(`SELECT count(1) as count FROM sqlite_master WHERE type = 'table' AND name = ?`, ['dos_zone_games']);
    if (res.count == 0) {
        await sqlite.setupDosZoneGamesTable();
    }
}

export function runTransaction(queries) {
    return sqlite.runTransaction(queries);
}

export async function init() {
    return sqlite.init();
}

export default init;
