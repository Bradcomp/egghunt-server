'use strict';
const express = require('express');
const router = express.Router();

const R = require('ramda');
const helpers = require('./helpers');

const EasterEgg = require('../models/easteregg');
const getNearbyEggs = require('../lib/getnearbyeggs');

const db = require('../lib/mongo');

const getPoint = R.compose(
    R.map(parseFloat),
    R.pick(['latitude', 'longitude']),
    R.defaultTo({}),
    R.prop('query')
)

const checkEggs = R.curry((user, eggs) =>
    R.find(egg => egg.user !== user.id && !R.contains(egg.id, user.eggsFound), eggs));

const updateUser = (user, egg) =>
    db.update('users', {id: user.id}, {$push: {eggsFound: egg.id}})
        .then(() => ({egg}));

//authorizedRequest takes care of attaching the User to the request.
router.use(helpers.authorizedRequest);

router.get('/', (req, res) => {
    db.query('eggs', {id : {$in: req.user.eggsFound}})
        .then(R.map(R.omit(['_id', '__v'])))
        .then(helpers.sendResult(res))
        .catch(helpers.sendError(res, 500));
});

router.post('/', (req, res) => {
    const attrs = req.body || {};
    const egg = EasterEgg(req.user.id, attrs.latitude, attrs.longitude, attrs.icon);

    if (!egg) return helpers.sendError(res, 400, 'invalid easter egg');

    getNearbyEggs(25, attrs.latitude, attrs.longitude)
        .then(eggs => eggs.length )
        .then(tooClose => tooClose ? null : db.insert('eggs', egg))
        .then(results => {
            if (results) return helpers.sendResult(res, {created: true, egg});
            return helpers.sendResult(res, {created: false});
        })
        .catch(helpers.sendError(res, 500));
});

router.delete('/:id', (req, res) => {
    const id = req.params.id;
    const user = req.user.id;
    db.remove('eggs', {id, user})
        .then(R.prop('nRemoved'))
        .then(removed => helpers.sendResult(res, {removed: !!removed}))
        .catch(helpers.sendError(res, 500))
});

router.get('/check', (req, res) => {
    let pt = getPoint(req);
    let user = req.user;
    if (!(pt.latitude && pt.longitude)) return helpers.sendError(res, 400, 'invalid query parameters');

    getNearbyEggs(10, pt.latitude, pt.longitude)
        .then(checkEggs(user))
        .then(egg => egg ? updateUser(user, egg) : {found: false})
        .then(egg => helpers.sendResult(res, {found: true, egg: R.omit(['_id'], egg)}))
        .catch(helpers.sendError(res, 500));
});

router.put('/guestbook', (req, res) => {
    const id = R.path(['body', 'egg'], req);
    const signature = req.user.signature;
    if (!id || !signature) return helpers.sendError(res, 400, 'missing egg id or signature');

    db.update('eggs', {id}, {$push: {guestbook, signature}})
        .then(R.prop('nModified'))
        .then(signed => {
            helpers.sendResult(res, {signed});
        })
        .catch(helpers.sendError(res, 500));
});

module.exports = router;
