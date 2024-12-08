import bcrypt from 'bcrypt';
import { logger } from '../logger/logger.js';

export async function encrypt(value) {
    const salt = await bcrypt.genSalt();
    return bcrypt.hashSync(value, salt, (err, hash) => {
        if (err) {
            logger.error(`Error hashing value: ${err}`);
            return;
        }
        return hash;
    });
}

export async function compare(value1, value2) {
    return bcrypt.compare(value1, value2);
}
