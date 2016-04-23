const S = require('sanctuary');
const F = require('fluture');
const R = require('ramda');

module.exports = x => S.maybe(F.reject(x), F.of);
