'use strict';
const R = require('ramda');
const S = require('sanctuary');
const F = require('fluture');
const findOne = require('../lib/mongo').findOne;
const config = require('../config');
const getAuth = S.compose(S.toMaybe, R.path(['headers', 'authorization']));

const adminOnly = (req, res, next) => {
    if (S.fromMaybe('', getAuth(req)) !== config.ADMIN_TOKEN) return res.sendStatus(401);
    next();
}

//This call will add the user to the request for future usage
const authorizedRequest = (req, res, next) => {

    const assignUser = user => {
        req.user = user;
        return next();
    }
    const handleAdmin = () => assignUser({});

    const handleNormie = S.pipe([
        apiKey => findOne('users', {apiKey}),
        F.fork(
            err => { return res.sendStatus(500); },
            R.ifElse(
                S.isNothing,
                () => res.sendStatus(401),
                R.map(assignUser)
            )
        )
    ]);

    const checkAuthorization = R.ifElse(
        R.equals(config.ADMIN_TOKEN),
        handleAdmin,
        handleNormie
    );
    const apiKey = getAuth(req);

    if (S.isNothing(apiKey)) return res.sendStatus(401);
    apiKey.map(checkAuthorization);
};

const sendResult = R.curry((res, data) => {
    res.status(200).json({
        status: 'success',
        data
    });
});

const sendError = R.curry((res, error) => {
    console.log(error);
    res.status(error.status || 500).json(R.omit(['status'], error));
});

module.exports = {adminOnly, authorizedRequest, sendResult, sendError};
