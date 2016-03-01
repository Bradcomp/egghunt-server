'use strict';
const uuid = require('node-uuid');

const User = apiKey => apiKey ? {apiKey, id: uuid.v4(), eggsFound: []} : false;

module.exports = User;
