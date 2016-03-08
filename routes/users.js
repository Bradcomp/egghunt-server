'use strict';
const express = require('express');
const router = express.Router();
const R = require('ramda');

const helpers = require('./helpers');
const makeAPIKey = require('../lib/apikey');
const createUser = require('../models/user');
const db = require('../lib/mongo');
const insertUser = db.insert('users');
const updateUser = db.update('users');
const deleteUser = db.remove('users');

router.post('/', helpers.adminOnly, (req, res) => {
    makeAPIKey()
        .then(createUser)
        .then(user =>
            insertUser(user)
                .then(() => {
                    helpers.sendResult(res, R.pick(["id", "apiKey"], user));
                })
        )
        .catch(helpers.sendError(res, 500));
});

router.delete('/:id', helpers.adminOnly, (req, res) => {
    const id = req.params.id;
    deleteUser({id})
    .then(R.prop('nRemoved'))
    .then(removed => helpers.sendResult(res, {removed}))
    .catch(helpers.sendError(res, 500));
});

router.put('/signature', helpers.authorizedRequest, (req, res) => {
    const signature = req.body && req.body.signature;
    if (!signature) return helpers.sendError(res, 400, 'Invalid signature');

    updateUser({id: req.user.id}, {$set: {signature}})
        .then(R.prop('nModified'))
        .then(updated => updated ?
            helpers.sendResult(res, {updated}) :
            helpers.sendError(res, 500, 'something went wrong')
        )
        .catch(helpers.sendError(res, 500));
});

module.exports = router;
