'use strict';
const expect = require('expect.js');
const request = require('supertest');
const R = require('ramda');
const db = require('../../lib/mongo');

const app = require('../../app');
app.listen(3001);

describe('User routes', () => {
    after(done => {
        db.remove('users', {}).then(() => done());
    });
    describe('Create User', () => {
        it('should reject invalid authentication', done => {
            request(app)
                .post('/users')
                .expect(401)
                .end(done);
        });
        it('should create a new user', done => {
            request(app)
                .post('/users')
                .set({authorization: 'FAKE TOKEN'})
                .expect(200)
                .end((err, result) => {
                    const user = R.path(['body', 'data'], result);
                    expect(user.apiKey).to.be.a('string');
                    expect(user.id).to.be.a('string');
                    db.findOne('users', {id: user.id})
                        .then(usr => {
                            expect(usr.apiKey).to.be(user.apiKey);
                            done();
                        })
                });
        });
    });
});
