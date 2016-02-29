'use strict';

const User = apiKey => apiKey ? {apiKey, eggsFound: []} : false;

module.exports = User;
