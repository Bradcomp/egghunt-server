'use strict';
const crypto = require('crypto');

const getBytes = size =>
    new Promise((resolve, reject) =>
        crypto.randomBytes(size, (err, result) =>
            err ? reject(err) : resolve(result)));

const makeAPIKey = () => getBytes(60).then(buf => buf.toString('base64'));

module.exports = makeAPIKey;
