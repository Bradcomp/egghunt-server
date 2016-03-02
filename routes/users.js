'use strict';
const express = require('express');
const router = express.Router();
const R = require('ramda');

const helpers = require('./helpers');
const makeAPIKey = require('../lib/apikey');
const createUser = require('../models/user');
const insert = require('../lib/mongo').insert;

router.post('/', helpers.adminOnly, (req, res) => {
    makeAPIKey()
        .then(createUser)
        .then(user =>
            insert('users', user)
                .then(() => {
                    helpers.sendResult(res, user);
                })
        )
        .catch(helpers.sendError(res, 500));
});

module.exports = router;
