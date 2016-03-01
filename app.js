'use strict';
require('./lib/mongo');
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var config = require('./config');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/users', require('./routes/users'));
app.use('/eggs', require('./routes/eggs'));

app.use((req, res, next) => {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send({
        message: err.message,
        error: {}
    });
});

module.exports = app;
