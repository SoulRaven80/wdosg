import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../logger/logger.js';

export async function fetchGame(gameUrl) {
    logger.debug(`Fetching game with URL: '${gameUrl}' from DosZone`);
    try {
        const response = await axios({
            url: gameUrl, 
            method: 'GET',
            responseType: 'arraybuffer'
        });
        logger.debug(`Successfully fetched game data from URL: '${gameUrl}'`);
        return response.data;
    } catch (error) {
        logger.error(`Error fetching DosZone game with URL: '${gameUrl}'. Error message: ${error.message}`);
        throw error;
    }
}

export async function fetchGameList() {
    logger.debug(`Fetching game list from fuzzy URL from DosZone`);
    try {
        const response = await axios({
            url: 'https://dos.zone/fuzzy-index.json',
            method: 'GET',
        });
        logger.debug(`Successfully fetched game list from fuzzy URL`);
        return response.data;
    } catch (error) {
        logger.error(`Error fetching DosZone game list from fuzzy URL. Error message: ${error.message}`);
        throw error;
    }
}

export async function findDosZoneGameData(item) {
    logger.debug(`Fetching game data from path ${item.v} from DosZone`);
    try {
        const htmlContent = await axios({
            url: `https://dos.zone${item.v}`,
            method: 'GET',
        });
        const $ = cheerio.load(htmlContent.data);
        const jsdosDiv = $('.jsdos');
        if (jsdosDiv.length > 0) {
            const dataUrl = jsdosDiv.attr('data-url');
            var genres = '';
            var year = 1900;
            var gameName = item.k.target.replaceAll(`'`, `''`);
            try {
                const metadata = await gamesRouter.fetchMetadata(item.k.target);
                if (metadata.length > 0) {
                    const md = metadata[0];
                    if (md.genres && md.genres.length > 0) {
                        genres = md.genres.map(item => item.name.replaceAll(`'`, `''`)).join(', ');
                    }
                    if (md.first_release_date) {
                        year = new Date(md.first_release_date * 1000).getFullYear();
                    }
                }
            } catch (error) {
                logger.warn(`Unable to fetch metadata from IGDB for game: '${item.k.target}'`);
            }
            const game = {};
            game['gameName'] = gameName;
            game['path'] = item.v;
            game['url'] = dataUrl;
            game['genres'] = genres;
            game['year'] = year;
            return game;
        } else {
            logger.warn(`Cannot find .jsdos file link within page: 'https://dos.zone${item.v}'`);
            return;
        }
    } catch (error) {
        logger.error(`Error fetching DosZone game data with title ${item.v}. Error message: ${error.message}`);
        throw error;
    }
}

export default fetchGame;