'use strict';
const express = require('express');
const router = express.Router();
const R = require('ramda');
const F = require('fluture');
const S = require('sanctuary');
const helpers = require('./helpers');
const makeAPIKey = require('../lib/apikey');
const createUser = require('../models/user');
const db = require('../lib/mongo');
const insertUser = db.insert('users');
const updateUser = db.update('users');
const deleteUser = db.remove('users');

const executeUserInsert = R.compose(R.map(insertUser))

router.post('/', helpers.adminOnly, (req, res) => {
    const keySize = 60;
    const handleError = helpers.sendError(res, 500);
    const handleSuccess = user => helpers.sendResult(res, R.pick(["id", "apiKey"], user))

    S.pipe([
        makeAPIKey,
        R.map(createUser),
        R.chain(user => insertUser(user).map(() => user)),
        F.fork(handleError, handleSuccess)
    ])(keySize);
});

const wasUpdated = R.compose(n => !!n, R.prop('n'));

router.delete('/:id', helpers.adminOnly, (req, res) => {
    const id = req.params.id;

    S.pipe([
        deleteUser,
        R.map(S.pipe([
            wasUpdated,
            R.assoc('removed', R.__, {})
        ])),
        F.fork(
            helpers.sendError(res, 500),
            helpers.sendResult(res)
        )
    ])({id});

});

router.put('/signature', helpers.authorizedRequest, (req, res) => {
    // const signature = R.compose(
    //     S.maybe(R.map(R.assocPath(['$set', ]))),
    //     S.toMaybe,
    //     R.path(['body', 'signature'])
    // )(req);
    const signature = R.path(['body', 'signature'])(req)
    const id = req.user.id;

    // S.pipe([
    //     R.map(updateUser({id})),
    //     R.map(R.map(wasUpdated)),
    //     R.map(R.chain(R.ifElse(
    //         R.identity,
    //         F.of,
    //         R.always(F.reject('something went wrong'))
    //     ))),
    //     R.map(F.fork(
    //         helpers.sendError(res, 500),
    //
    //     ))
    // ])(signature)

    if (!signature) return helpers.sendError(res, 400, 'Invalid signature');

    updateUser({id: req.user.id}, {$set: {signature}})
        .then(R.prop('n'))
        .then(updated => updated ?
            helpers.sendResult(res, {updated: !!updated, signature}) :
            helpers.sendError(res, 500, 'something went wrong')
        )
        .catch(helpers.sendError(res, 500));
});

module.exports = router;
