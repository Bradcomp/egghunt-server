'use strict';
const express = require('express');
const router = express.Router();

const R = require('ramda');
const helpers = require('./helpers');

const EasterEgg = require('../models/easteregg');
const getNearbyEggs = require('../lib/getnearbyeggs');
const update = require('../lib/mongo').update('users');
const insertEgg = require('../lib/mongo').insert('eggs');

const getPoint = R.compose(
    R.map(parseFloat),
    R.pick(['latitude', 'longitude']),
    R.defaultTo({}),
    R.prop('query')
)

const checkEggs = R.curry((user, eggs) =>
    R.find(egg => egg.user !== user.id && !R.contains(egg.id, user.eggsFound), eggs));

const updateUser = (user, egg) =>
    update({id: user.id}, {$push: {eggsFound: egg.id}})
        .then(() => ({egg}));

//authorizedRequest takes care of attaching the User to the request.
router.use(helpers.authorizedRequest);

router.get('/check', (req, res) => {
    let pt = getPoint(req);
    let user = req.user;
    if (!(pt.latitude && pt.longitude)) return helpers.sendError(res, 400, 'invalid query parameters');

    getNearbyEggs(10, pt.latitude, pt.longitude)
        .then(checkEggs(user))
        .then(egg => egg ? updateUser(user, egg) : {egg: false})
        .then(helpers.sendResult(res))
        .catch(helpers.sendError(res, 500));
});

router.post('/', (req, res) => {
    let attrs = req.body || {};
    let egg = EasterEgg(req.user.id, attrs.latitude, attrs.longitude, attrs.icon);

    if (!egg) return helpers.sendError(res, 400, 'invalid easter egg');

    getNearbyEggs(25, attrs.latitude, attrs.longitude)
        .then(eggs => eggs.length )
        .then(tooClose => tooClose ? null : insertEgg(egg))
        .then(results => {
            if (results) return helpers.sendResult(res, {created: true, egg});
            return helpers.sendResult(res, {created: false});
        })
        .catch(helpers.sendError(res, 500));
});

module.exports = router;
