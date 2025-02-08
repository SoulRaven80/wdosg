import express from 'express';
import { verifyAdminToken } from '../middleware/userTokenMiddleware.js';
import * as dataProvider from '../providers/dataProvider.js';
import querystring from 'querystring';

export const router = express.Router();

router.get('/', verifyAdminToken, async(req, res) => {
    const itemsPerPage = 20;
    var page = parseInt(req.query.page) || 1; // Default to page 1 if no page is specified
    const filter = querystring.unescape(req.query.filter) || ''; // Filter keyword from query params
    const genre = querystring.unescape(req.query.genre) || ''; // Filter keyword from query params

    var count = await dataProvider.countDosZoneGames(filter, genre);
    const totalPages = Math.ceil(count / itemsPerPage);
    page = Math.min(page, totalPages);
    const offset = (page - 1) * itemsPerPage;

    var list = await dataProvider.listDosZoneGames(itemsPerPage, offset, filter, genre);

    // Calculate the range of pages to display (limit to 10 page links)
    const rangeSize = 10;
    let startPage = Math.max(1, page - Math.floor(rangeSize / 2));
    let endPage = Math.min(totalPages, startPage + rangeSize - 1);

    // Adjust startPage if we are near the last page
    if (endPage - startPage < rangeSize - 1) {
        startPage = Math.max(1, endPage - rangeSize + 1);
    }
    res.status(200).json({
        currentPage: page,
        totalPages: totalPages,
        startPage: startPage,
        endPage: endPage,
        items: list
    });
});

router.get('/genres', verifyAdminToken, async(req, res) => {
    var genres = await dataProvider.listDosZoneGenres();
    genres = genres.map(g => g.genre);
    // Some games had multiple genre in the same value. Splitting and filtering
    var filteredGenres = [];
    for (let i = 0; i < genres.length; i++) {
        const genre = genres[i];
        filteredGenres = filteredGenres.concat(genre.split(','));
    }
    res.status(200).json(
        filteredGenres.map(g => g.trim()).sort().filter(function(item, pos, ary) {
            return !pos || item != ary[pos - 1];
        })
    );
});

router.get('/find', verifyAdminToken, async(req, res) => {
    if (!req.query.id || !parseInt(req.query.id)) {
        return res.status(422).send('Empty or invalid game id');
    }
    var gameId = parseInt(req.query.id);
    var game = await dataProvider.findDosZoneGame(gameId);

    res.status(200).json({
        url: game.url,
        title: game.title,
        id: game.id
    });
});