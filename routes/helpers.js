'use strict';
const R = require('ramda');
const findOne = require('../lib/mongo').findOne;
const config = require('../config');
const getAuth = R.path(['headers', 'authorization']);

const adminOnly = (req, res, next) => {
    if (getAuth(req) !== config.ADMIN_TOKEN) return res.sendStatus(401);
    next();
}

//This call will add the user to the request for future usage
const authorizedRequest = (req, res, next) => {
    const apiKey = getAuth(req);
    if (apiKey === config.ADMIN_TOKEN) {
        req.user = {};
        return next();
    }
    findOne('users', {apiKey})
    .then(user => {
        if (!user) return res.sendStatus(401);
        req.user = user;
        return next();
    })
    .catch(err => { return res.sendStatus(500); })
};

const sendResult = R.curry((res, data) => {
    res.status(200).json({
        status: 'success',
        data
    });
});

const sendError = R.curry((res, status, error) => {
    console.log(error);
    res.status(status).json({error});
});

module.exports = {adminOnly, authorizedRequest, sendResult, sendError};
