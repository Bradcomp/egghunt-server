'use strict';
const mongo = require('mongojs');
const R = require('ramda');
const config = require('../config');
const collections = ["users", "eggs"];
const S = require('sanctuary');
const Future = require('fluture');

const db = mongo(config.MONGO_URI, collections);

db.eggs.createIndex({location: '2dsphere'});

const checkCollection = R.contains(R.__, collections);

function processRequest(action) {
    return function(coll) {
        if (!checkCollection(coll)) return Promise.reject("invalid collection");

        let args = Array.from(arguments).slice(1);
        return Future((reject, resolve) => {
            db[coll][action].apply(db[coll], args.concat((err, result) => err ? reject(err) : resolve(result)));
        });
    }
}

// String -> (Query, Projection?) -> Future Maybe Document
const findOne = R.curryN(2, R.compose(R.map(S.toMaybe), processRequest('findOne')));

//Clone is used here to avoid mutating the original object
const insert = R.curry((coll, record) => processRequest('insert')(coll, R.clone(record)));

const query = R.curryN(2, processRequest('find'));

const update = R.curryN(3, processRequest('update'));

const remove = R.curryN(2, processRequest('remove'));

module.exports = {db, findOne, insert, query, update, remove};
