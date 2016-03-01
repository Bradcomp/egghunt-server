'use strict';
const mongo = require('mongojs');
const R = require('ramda');
const config = require('../config');
const collections = ["users", "eggs"];

const db = mongo(config.MONGO_URI, collections);

db.eggs.createIndex({location: '2dsphere'});

const insert = R.curry((coll, record) => new Promise((resolve, reject) => {
    if (!R.contains(coll, collections)) return reject("invalid collection");

    //Clone is used here to avoid mutating the original object
    db[coll].insert(R.clone(record), (err, result) => err ? reject(err) : resolve(result));
}));

const query = R.curry((coll, qry) => new Promise((resolve, reject) => {
    if (!R.contains(coll, collections)) return reject("invalid collection");
    db[coll].find(qry, (err, result) => err ? reject(err) : resolve(result));
}));

const update = R.curry((coll, qry, changes) => new Promise((resolve, reject) => {
    if (!R.contains(coll, collections)) return reject("invalid collection");
    db[coll].update(qry, changes, (err, result) => err ? reject(err) : resolve(result));
}));

module.exports = {db, insert, query, update};
