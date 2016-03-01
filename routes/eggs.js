'use strict';
const express = require('express');
const router = express.Router();

const R = require('ramda');
const helpers = require('./helpers');
const getNearbyEggs = require('../lib/getnearbyeggs');
const update = require('../lib/mongo').update('users');

const getPoint = R.compose(
    R.map(parseFloat),
    R.pick(['latitude', 'longitude']),
    R.defaultTo({}),
    R.prop('query')
)

const checkEggs = R.curry((user, eggs) =>
    R.find(egg => egg.user !== user.id && !R.contains(egg.id, user.eggsFound), eggs));

const updateUser = (user, egg) =>
    update({id: user.id}, {$push: {eggsFound: egg}})
        .then(() => {egg});

//authorizedRequest takes care of attaching the User to the request.
router.use(helpers.authorizedRequest);

router.get('/check', (req, res) => {
    let pt = getPoint(req);
    if (!(pt.latitude && pt.longitude)) return helpers.sendError(res, 400, 'invalid query parameters');

    getNearbyEggs(10, pt.latitude, pt.longitude)
        .then(R.defaultTo([]))
        .then(checkEggs(user))
        .then(egg => egg ? updateUser(user, egg) : {egg: false})
        .then(helpers.sendResult(res))
        .catch(helpers.sendError(res, 500));
});

module.exports = router;
