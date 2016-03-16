'use strict';
const expect = require('expect.js');
const request = require('supertest');
const R = require('ramda');
const db = require('../../lib/mongo');

const app = require('../../app');

const sampleUser = {
    id: 'abc123',
    apiKey: 'zyxwvut',
    eggsFound: []
}

describe('Easter egg routes', () => {
    before(done => {
        db.insert('users', sampleUser)
            .then(() => db.remove('eggs', {}))
            .then(() => done());
    });
    after(done => {
        db.remove('users', {})
            .then(() => db.remove('eggs', {}))
            .then(() => done());
    });
    describe('Create a new egg', () => {
        it('should require an authenticated user', done => {
            request(app)
                .post('/eggs')
                .expect(401)
                .end(done);
        });
        it('should require a latitude and longitude', done => {
            request(app)
                .post('/eggs')
                .set({authorization: 'zyxwvut'})
                .send({
                    "latitude": 38.7071247,
                    "icon": "B"
                })
                .expect(400)
                .end((err, result) => {
                    expect(result.body).to.eql({error: 'invalid easter egg'});
                    done();
                });
        });
        it('should require an icon', done => {
            request(app)
                .post('/eggs')
                .set({authorization: 'zyxwvut'})
                .send({
                    "latitude": 38.7071247,
                    "longitude": -121.2810611
                })
                .expect(400)
                .end((err, result) => {
                    expect(result.body).to.eql({error: 'invalid easter egg'});
                    done();
                });
        });
        it('should create a new egg', done => {
            request(app)
                .post('/eggs')
                .set({authorization: 'zyxwvut'})
                .send({
                    "latitude": 38.7071247,
                    "longitude": -121.2810611,
                    "icon": "B"
                })
                .expect(200)
                .end((err, result) => {
                    const egg = R.path(['body', 'data', 'egg'], result);
                    expect(egg.id).to.be.a('string');
                    expect(egg.user).to.be('abc123');
                    expect(egg.icon).to.be('B');
                    expect(egg.location).to.eql({
                        type: 'Point',
                        coordinates: [-121.2810611, 38.7071247]
                    });
                    done();
                });
        });
    });
    describe('Get found eggs', () => {
        it('should require an authenticated user', done => {
            request(app)
                .get('/eggs')
                .expect(401)
                .end(done);
        });
    });
});
