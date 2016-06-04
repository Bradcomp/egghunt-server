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
const maybeToFuture = require('../lib/maybetofuture');
const insertUser = db.insert('users');
const updateUser = db.update('users');
const deleteUser = db.remove('users');

const executeUserInsert = R.compose(R.map(insertUser))

router.post('/', helpers.adminOnly, (req, res) => {
    const keySize = 60;
    const handleError = () => helpers.sendError(res, {status: 500, message: 'something went wrong'});
    const handleSuccess = user => helpers.sendResult(res, R.pick(["id", "apiKey"], user))

    S.pipe([
        makeAPIKey,
        R.map(createUser),
        R.chain(user => insertUser(user).map(() => user)),
        F.fork(handleError, handleSuccess)
    ])(keySize);
});

router.delete('/:id', helpers.adminOnly, (req, res) => {
    const id = req.params.id;

    S.pipe([
        deleteUser,
        R.map(S.pipe([
            R.prop('n'),
            Boolean,
            R.objOf('removed')
        ])),
        F.fork(
            err => R.compose(helpers.sendError(res), R.merge({status: 500})),
            helpers.sendResult(res)
        )
    ])({id});

});

router.put('/signature', helpers.authorizedRequest, (req, res) => {
    const signature = R.map(
        R.assocPath(['$set', 'signature'], R.__, {}),
        S.gets(String, ['body', 'signature'], req)
    );
    const id = req.user.id;
    S.pipe([
        maybeToFuture({status: 400, message: 'Invalid signature'}),
        R.chain(updateUser({id})),
        R.map(R.prop('n')),
        R.chain(updated => {
            return updated ?
                F.of(R.map(R.assoc('updated', true), R.chain(S.get(Object, '$set'), signature))) :
                F.reject({status: 500, message: 'something went wrong'})
        }),
        F.fork(
            R.compose(helpers.sendError(res), R.merge({status: 500})),
            R.map(helpers.sendResult(res))
        )
    ])(signature)

});

module.exports = router;
