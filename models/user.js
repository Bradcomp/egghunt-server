'use strict';
const uuid = require('node-uuid');

// String -> User
const User = apiKey => ({apiKey, id: uuid.v4(), eggsFound: []});

module.exports = User;
