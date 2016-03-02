'use strict';
const mongo = require('mongojs');
const R = require('ramda');
const config = require('../config');
const collections = ["users", "eggs"];

const db = mongo(config.MONGO_URI, collections);

db.eggs.createIndex({location: '2dsphere'});

const checkCollection = R.contains(R.__, collections);

function processRequest(action) {
    return function(coll) {
        if (!checkCollection(coll)) return Promise.reject("invalid collection");

        let args = Array.from(arguments).slice(1);
        return new Promise((resolve, reject) => {
            db[coll][action].apply(db[coll], args.concat((err, result) => err ? reject(err) : resolve(result)));
        });
    }
}

const findOne = processRequest('findOne');

//Clone is used here to avoid mutating the original object
const insert = (coll, record) => processRequest('insert')(coll, R.clone(record));

const query = processRequest('find');

const update = processRequest('update');

module.exports = {db, findOne, insert, query, update};
