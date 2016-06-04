'use strict';
const crypto = require('crypto');
const Future = require('fluture');
const R = require('ramda');

const getBytes = size => Future.node(crypto.randomBytes.bind(crypto, size));

// Number -> Future String
const makeAPIKey = R.compose(R.map(buf => buf.toString('base64')), getBytes);

module.exports = makeAPIKey;
