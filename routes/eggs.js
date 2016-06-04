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

const getFloat = field => R.compose(R.chain(S.parseFloat), S.get(String, field));

const getPoint = S.pipe([
    S.get(Object, 'query'),
    R.chain(R.converge(
        R.unapply(R.sequence(S.Maybe.of)),
        [getFloat('longitude'), getFloat('latitude')]
    ))
])


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
    const insertEgg = egg => db.insert('eggs', egg).map(() => ({egg, created: true}));
    S.pipe([
        maybeToFuture({status: 400, message: 'invalid easter egg'}),
        R.map(eggLocation),
        R.chain(getNearbyEggs(25)),
        R.chain(nearby =>
            nearby.length > 0 ?
                F.of(S.Just({created: false})) :
                R.sequence(F.of, R.map(insertEgg, egg))
        ),
        F.fork(
            R.compose(helpers.sendError(res), R.merge({status: 500})),
            R.map(helpers.sendResult(res))
        )
    ])(egg)
});

router.delete('/:id', (req, res) => {
    const id = req.params.id;
    const user = req.user.id;

    S.pipe([
        db.remove('eggs'),
        R.map(S.pipe([
            R.prop('n'),
            Boolean,
            R.objOf('removed')
        ])),
        F.fork(
            helpers.sendError(res),
            helpers.sendResult(res)
        )
    ])({id, user});
});

router.get('/check', (req, res) => {
    const user = req.user;

    S.pipe([
        getPoint,
        maybeToFuture({status: 400, message: 'invalid query parameters'}),
        R.chain(getNearbyEggs(10)),
        R.map(checkEggs(user)),
        R.chain(S.maybe(F.of({found: false}), egg => updateUser(user, egg).map(() => egg))),
        F.fork(
            helpers.sendError(res),
            helpers.sendResult(res)
        )
    ])(req);
});

router.put('/guestbook', (req, res) => {
    const data = R.sequence(S.Maybe.of,
        [
            S.gets(String, ['body', 'egg'], req),
            S.gets(String, ['user', 'signature'], req)
        ]
    );
    S.pipe([
        maybeToFuture({status: 400, message: 'missing egg id or signature'}),
        R.chain(([id, signature]) =>
            db.update('eggs', {id}, {$push: {guestbook: signature}})
        ),
        R.map(R.compose(R.objOf('signed'), Boolean, R.prop('n'))),

        F.fork(
            helpers.sendError(res),
            helpers.sendResult(res)
        )
    ])(data);
});

module.exports = router;
