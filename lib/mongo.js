'use strict';
const mongo = require('mongojs');
const R = require('ramda');
const config = require('../config');
const collections = ["users", "eggs"];

const db = mongo(config.MONGO_URI, collections);

const insert = R.curry((coll, record) => new Promise((resolve, reject) => {
    if (!R.contains(coll, collection)) return reject("invalid collection");
    db[coll].insert(record, (err, result) => err ? reject(err) : resolve(result));
}));

module.exports = {db, insert};
