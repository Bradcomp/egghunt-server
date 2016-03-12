'use strict';
const expect = require('expect.js');
const request = require('supertest');
const R = require('ramda');
const db = require('../../lib/mongo');

const app = require('../../app');

describe('Easter egg routes', () => {
    describe('Get found eggs', () => {
        it('should require an authenticated user', done => {
            request(app)
                .post('/users')
                .expect(401)
                .end(done);
        });
    });
});
