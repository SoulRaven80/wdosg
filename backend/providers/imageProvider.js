import fs from 'fs';
import imageDownloader from 'image-downloader';
import { logger } from '../logger/logger.js';

export const downloadImage = (url, imagePath, destFileName, errorImage) => {
    imageDownloader.image({
        url: url,
        dest: imagePath + destFileName,
        extractFilename: false
    }).then(({ filename }) => {
        logger.debug(`Saved image to ${filename}`);
    }).catch((err) => {
        logger.debug(`Error while saving image to ${imagePath + destFileName}: ${err}`);
        fs.copyFileSync(errorImage, imagePath + destFileName);
    });
};
