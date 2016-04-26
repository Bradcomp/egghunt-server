'use strict';
const expect = require('expect.js');
const R = require('ramda');
const S = require('sanctuary'); 
const db = require('../../lib/mongo');

const app = require('../../app');
const request = require('../helpers/requesttofuture')(app);

const sampleUser = {
    id: 'abc123',
    apiKey: 'zyxwvut',
    eggsFound: []
}
const sample2 = {
    id: 'zyx987',
    apiKey: 'abcdefg',
    eggsFound: []
}

describe('Easter egg routes', () => {
    before(done => {
        db.insert('users', sampleUser)
            .chain(() => db.insert('users', sample2))
            .chain(() => db.remove('eggs', {}))
            .fork(console.log, () => done());
    });
    after(done => {
        db.remove('users', {})
            //.chain(() => db.remove('eggs', {}))
            .fork(console.log, () => done());
    });
    describe('Create a new egg', () => {
        it('should require an authenticated user', done => {
            request('post', '/eggs', null, null, 401)
                .fork(console.log, () => done());
        });
        it('should require a latitude and longitude', done => {
            const body = {
                "latitude": 38.7071247,
                "icon": "B"
            }
            request('post', '/eggs', 'zyxwvut', body, 400)
                .fork(
                    console.log,
                    result => {
                        expect(result.body).to.eql({message: 'invalid easter egg'});
                        done();
                    }
                );
        });
        it('should require an icon', done => {
            const body = {
                "latitude": 38.7071247,
                "longitude": -121.2810611
            }
            request('post', '/eggs', 'zyxwvut', body, 400)
                .fork(
                    console.log,
                    result => {
                        expect(result.body).to.eql({message: 'invalid easter egg'});
                        done();
                    }
                );
        });
        it('should create a new egg', done => {
            const body = {
                "latitude": 38.7071247,
                "longitude": -121.2810611,
                "icon": "B"
            };
            request('post', '/eggs', 'zyxwvut', body, 200)
                .chain(result => {
                    const egg = R.path(['body', 'data', 'egg'], result);
                    expect(egg.id).to.be.a('string');
                    expect(egg.user).to.be('abc123');
                    expect(egg.icon).to.be('B');
                    expect(egg.location).to.eql({
                        type: 'Point',
                        coordinates: [-121.2810611, 38.7071247]
                    });
                    return db.findOne('eggs', {id: egg.id})
                })
                .fork(
                    console.log,
                    result => {

                    }
                    );
        });
        it('should refuse to create an egg too close to another', done => {
            const body = {
                "latitude": 38.7071248,
                "longitude": -121.2810610,
                "icon": "B"
            };
            request('post', '/eggs', 'zyxwvut', body, 200)
                .fork(
                    console.log,
                    result => {
                        expect(R.path(['body', 'data', 'created'], result)).to.be(false);
                        done();
                });
        });
    });
    describe('Check for an egg', () => {
        it('should require lat and long', done => {
            request('get', '/eggs/check', 'zyxwvut', null, 400)
                .fork(
                    console.log,
                    result => {
                        expect(result.body.error).to.be('invalid query parameters');
                        done();
                });
        });
        it('should not find your own egg', done => {
            const query = {
                "latitude": 38.7071248,
                "longitude": -121.2810610
            };
            request('get', '/eggs/check', 'zyxwvut', query, 200)
                .fork(
                    console.log,
                    result => {
                    expect(result.body.data).to.eql({found: false});
                    done();
                })
        });
    });
    describe('Get found eggs', () => {
        it('should require an authenticated user', done => {
            request('get', '/eggs', null, null, 401)
                .fork(console.log, () => done());
        });

        it('should not retrieve eggs for the user that has none', done => {
            request('get', '/eggs', 'zyxwvut', null, 200)
                .fork(
                    console.log,
                    result => {
                        expect(result.body.data).to.eql([]);
                        done();
                });
        });
    });
});
