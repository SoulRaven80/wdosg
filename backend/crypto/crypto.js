import bcrypt from 'bcryptjs';
const crypto = await import('node:crypto');

export function encrypt(value) {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(value, salt);
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