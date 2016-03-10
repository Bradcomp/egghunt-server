'use strict';
var config = require('../config');
config.MONGO_URI = 'mongodb://localhost:27017/egghunt-test'
require('./routes/users');
