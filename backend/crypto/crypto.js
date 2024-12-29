import bcrypt from 'bcrypt';
import { logger } from '../logger/logger.js';
const crypto = await import('node:crypto');

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

export function randomToken() {
    return crypto.randomBytes(24).toString('hex');
}

export function randomPassword() {
    return crypto.randomBytes(12).toString('hex');
}