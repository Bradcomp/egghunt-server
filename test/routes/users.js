'use strict';
const expect = require('expect.js');
const R = require('ramda');
const S = require('sanctuary');
const db = require('../../lib/mongo');
const maybeToFuture = require('../../lib/maybetofuture');

const app = require('../../app');
const request = require('../helpers/requesttofuture')(app);

const sampleUser = {
    id: 'abc123',
    apiKey: 'zyxwvut',
    eggsFound: []
}

describe('User routes', () => {
    after(done => {
        db.remove('users', {}).fork(console.log, () => done());
    });
    describe('Create User', () => {
        it('should reject invalid authentication', done => {
            request('post', '/users', null, null, 401)
                .fork(console.log, () => done());
        });
        it('should create a new user', done => {
            request('post', '/users', 'FAKE TOKEN', null, 200)
                .chain(result => {
                    const user = R.path(['body', 'data'], result);
                    expect(user.apiKey).to.be.a('string');
                    expect(user.id).to.be.a('string');
                    return db.findOne('users', {id: user.id, apiKey: user.apiKey})
                })
                .fork(
                    console.log,
                    user => {
                        expect(S.isNothing(user)).to.be(false);
                        done();
                    }
                );
        });
    });
    describe('Add user signature', () => {
        const sigRequest = request('put', '/users/signature');
        before(done => db.insert('users', sampleUser).fork(console.log, () => done()));

        it('should require authentication', done => {
            sigRequest(null, null, 401)
                .fork(console.log, () => done());
        });
        it('should require a signature', done => {
            sigRequest('FAKE TOKEN', null, 400)
                .fork(
                    console.error,
                    result => {
                        expect(result.body).to.eql({message: 'Invalid signature'});
                        done();
                    }
                );

        });
        it('should require a real user', done => {
            sigRequest('FAKE TOKEN', {signature: 'I am an admin'}, 500)
                .fork(
                    console.log,
                    result => {
                    expect(result.body).to.eql({message: 'something went wrong'});
                    done();
                });
        });
        it('should set a signature for a user', done => {
            sigRequest('zyxwvut', {signature: 'I am a sample'}, 200)
                .chain(result => {
                    expect(result.body).to.eql({
                        status: 'success',
                        data: { updated: true, signature: 'I am a sample' }
                    });
                    return db.findOne('users', sampleUser);
                })
                .fork(
                    console.log,
                    R.map(user => {
                        expect(user.signature).to.be('I am a sample');
                        done();
                    })
                );

        });
    });
    describe("Delete a member", () => {
        it('should require an ID', done => {
            request('del', '/users', 'FAKE TOKEN', null, 404)
                .fork(console.log, () => done())

        });
        it('should require admin authentication', done => {
            request('del', '/users/abc123', 'zyxwvut', null, 401)
                .fork(console.log, () => done())
        });
        it('should delete a user', done => {
            db.findOne('users', {id: 'abc123'})
                .chain(maybeToFuture('User does not exist'))
                .chain(user => {
                    expect(user.apiKey).to.be('zyxwvut');
                    return request('del', '/users/abc123', 'FAKE TOKEN', null, 200);
                })
                .chain(result => {
                    expect(result.body.data).to.eql({removed: true});
                    return db.findOne('users', {id: 'abc123'});
                })
                .fork(
                    console.error,
                    user => {
                        expect(S.isNothing(user)).to.be(true);
                        done();
                    }
                )

        });
        it('should let the user know if nothing was removed', done => {
            request('del', '/users/abc123', 'FAKE TOKEN', null, 200)
                .fork(
                    console.error,
                    result => {
                        expect(result.body.data).to.eql({removed: false});
                        done();
                    }
                );
        });
    });
});
