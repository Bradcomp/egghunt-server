'use strict';
const express = require('express');
const router = express.Router();

const R = require('ramda');
const S = require('sanctuary');
const F = require('fluture');
const helpers = require('./helpers');
const maybeToFuture = require('../lib/maybetofuture');

const EasterEgg = require('../models/easteregg');
const getNearbyEggs = require('../lib/getnearbyeggs');

const db = require('../lib/mongo');

const getPoint = R.compose(
    R.map(parseFloat),
    R.pick(['latitude', 'longitude']),
    R.defaultTo({}),
    R.prop('query')
)

const eggLocation = R.path(['location', 'coordinates']);

const checkEggs = R.curry((user, eggs) =>
    S.toMaybe(R.find(egg => egg.user !== user.id && !R.contains(egg.id, user.eggsFound), eggs)));

const updateUser = (user, egg) =>
    db.update('users', {id: user.id}, {$push: {eggsFound: egg.id}})
        .map(() => ({egg, found: true}));

//authorizedRequest takes care of attaching the User to the request.
router.use(helpers.authorizedRequest);

router.get('/', (req, res) => {
    S.pipe([
        R.path(['user', 'eggsFound']),
        R.assocPath(['id', '$in'], R.__, {}),
        db.query('eggs'),
        R.map(R.map(R.omit(['_id', '__v']))),
        F.fork(
            R.compose(helpers.sendError(res), R.merge({status: 500})),
            helpers.sendResult(res)
        )
    ])(req);
});

router.post('/', (req, res) => {
    const attrs = S.get(Object, 'body', req);
    const egg = R.chain(egg => EasterEgg(req.user.id, egg.latitude, egg.longitude, egg.icon), attrs);
    S.pipe([
        maybeToFuture({status: 400, message: 'invalid easter egg'}),
        R.map(eggLocation),
        R.chain(R.pipe(
            getNearbyEggs(25),
            R.map(nearby =>
                nearby.length > 0 ?
                    S.Just({created: false}) :
                    R.map(R.assoc('egg', R.__, {created: true}), egg)
            )
        )),
        F.fork(
            R.compose(helpers.sendError(res), R.merge({status: 500})),
            R.map(helpers.sendResult(res))
        )
    ])(egg)
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
        .then(egg => helpers.sendResult(res, egg))
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
