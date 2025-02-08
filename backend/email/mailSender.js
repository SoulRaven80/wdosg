import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { logger } from '../logger/logger.js';
import * as config from '../../config.js';
import { publicIpv4 } from 'public-ip';

if (process.env.EMAIL_PASS_FILE) {
    process.env.EMAIL_PASS = fs.readFileSync(process.env.EMAIL_PASS_FILE, 'utf8').trim();
}
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const registrationPath = '/finish-registration.html?email={{email}}&token={{token}}';
const passwordResetPath = '/api/password/startReset?email={{email}}&token={{token}}';
var registrationLink = '';
var passwordResetLink = '';

export async function init(appPort) {
    registrationLink = process.env.SERVER_FRIENDLY_URL ? process.env.SERVER_FRIENDLY_URL + registrationPath :
        '//' + (await publicIpv4()) + ':' + appPort + registrationPath;
    passwordResetLink = process.env.SERVER_FRIENDLY_URL ? process.env.SERVER_FRIENDLY_URL + passwordResetPath :
        '//' + (await publicIpv4()) + ':' + appPort + passwordResetPath;
}

async function sendEmail(emailTo, emailSubject, emailBody) {
    if (!emailTo) {
        logger.error('Email address is undefined');
        throw new Error('Email address is undefined');
    }
    logger.info(`Sending invitation email to ${emailTo}`);
    return transporter.sendMail({
        from: `"wDOSg" <${process.env.EMAIL_USER}>`,
        to: emailTo,
        subject: emailSubject,
        html: emailBody
    });
}

export async function sendInviteEmail(emailTo, token) {
    const emailTemplatePath = path.join(config.getRootPath(), 'email_template', 'invite_email_body.html');
    const link = registrationLink.replace('{{email}}', emailTo).replace('{{token}}', token);
    const emailBody = fs.readFileSync(emailTemplatePath, 'utf8')
        .replace('{{usermail}}', emailTo)
        .replace('{{year}}', new Date().getFullYear())
        .replace('{{link}}', link);
    return sendEmail(emailTo, 'Welcome to wDOSg', emailBody);
}

export async function sendResetPasswordEmail(emailTo, token) {
    const emailTemplatePath = path.join(config.getRootPath(), 'email_template', 'forgot_password_email_body.html');
    const link = passwordResetLink.replace('{{email}}', emailTo).replace('{{token}}', token);
    const emailBody = fs.readFileSync(emailTemplatePath, 'utf8')
        .replace('{{usermail}}', emailTo)
        .replace('{{year}}', new Date().getFullYear())
        .replace('{{link}}', link);
    return sendEmail(emailTo, 'wDOSg - Reset password', emailBody);
}
