import igdb from 'igdb-api-node';
import { logger } from '../logger/logger.js';

export async function searchGame(name) {
    logger.debug(`Calling IGDB for game with name: ${name}`);
    var response;
    try {
        response = await igdb.default()
            .fields('category,cover.image_id,first_release_date,genres.name,involved_companies.id,involved_companies.developer,involved_companies.publisher,involved_companies.company.name,name,platforms.name,screenshots.image_id,status,summary,url,videos.name,videos.video_id')
            .limit(50)
            .search(name)
            .where('release_dates.platform = (13)') // filter the results by DOS
            .request('/games');
    } catch (error) {
        logger.error(`Error calling IGDB API. Please check IGDB configuration. Error message: ${error.message}`);
        throw error;
    }
    var result = response.data.filter(function(i) {
        const release = (i.first_release_date !== undefined && i.first_release_date !== null); // has been released
        return release;
    });
    
    logger.debug(`IGDB game data: ${JSON.stringify(result, null, 2)}`);
    return result;
}

export default searchGame;