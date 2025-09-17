import axios from 'axios';
import { logger } from '../logger/logger.js';

export async function searchGame(name) {
    if (process.env.TWITCH_CLIENT_ID == 'DISABLED') {
        return [];
    }
    logger.debug(`Calling IGDB for game with name: ${name}`);
    try {
        const accessToken = await axios.post('https://id.twitch.tv/oauth2/token', {
            client_id: process.env.TWITCH_CLIENT_ID,
            client_secret: process.env.TWITCH_CLIENT_SECRET,
            grant_type: 'client_credentials'
        });
        const response = await axios.post('https://api.igdb.com/v4/games',
            `fields category,cover.image_id,first_release_date,genres.name,involved_companies.id,involved_companies.developer,involved_companies.publisher,involved_companies.company.name,name,platforms.name,screenshots.image_id,status,summary,url,videos.name,videos.video_id;
            limit 50;
            search "${name}";
            where release_dates.platform = (13);`,
            {
                headers: {
                    'Client-ID': process.env.TWITCH_CLIENT_ID,
                    'Authorization': `Bearer ${accessToken.data.access_token}`,
                    'Accept': 'application/json'
                }
            }
        );
        var result = response.data.filter(function(i) {
            const release = (i.first_release_date !== undefined && i.first_release_date !== null); // has been released
            return release;
        });
        logger.debug(`IGDB game data: ${JSON.stringify(result, null, 2)}`);
        return result;
    } catch (error) {
        logger.error(`Error calling IGDB API. Please check IGDB configuration. Error message: ${error.message}`);
        throw error;
    };
}

export default searchGame;