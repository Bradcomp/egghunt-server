const F = require('fluture');
const curry = require('ramda/src/curry');
const request = require('supertest');

module.exports = curry((app, method, url, authorization, body, status) => {
    const req = request(app)[method](url);
    const dataTransport = ['get', 'del'].indexOf(method) >= 0 ? 'query' : 'send';
    if (authorization) req.set({authorization});
    if (body) req[dataTransport](body);
    req.expect(status);
    return F.node(req.end.bind(req));
});
