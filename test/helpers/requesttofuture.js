const F = require('fluture');
const curry = require('ramda/src/curry');
const request = require('supertest');

module.exports = curry((app, method, url, authorization, body, status) => {
    const req = request(app)[method](url);
    if (authorization) req.set({authorization});
    if (body) req.send(body);
    req.expect(status);
    return F.node(req.end.bind(req));
});
