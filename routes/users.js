'use strict';
const express = require('express');
const router = express.Router();
const R = require('ramda');

const helpers = require('./helpers');
const makeAPIKey = require('../lib/apikey');
const createUser = require('../models/user');
const insertUser = require('../lib/mongo').insert('users');

router.post('/', helpers.adminOnly, (req, res) => {
    makeAPIKey()
        .then(createUser)
        .then(user =>
            insertUser(user)
                .then(() => {
                    helpers.sendResult(res, R.omit(['_id'], user));
                })
        )
        .catch(helpers.sendError(res, 500));

});

module.exports = router;
