import axios from 'axios';
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

export default fetchGame;