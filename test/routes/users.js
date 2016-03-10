'use strict';
const expect = require('expect.js');
const request = require('supertest');
const R = require('ramda');
const db = require('../../lib/mongo');

const app = require('../../app');
app.listen(3001);

const sampleUser = {
    id: 'abc123',
    apiKey: 'zyxwvut',
    eggsFound: []
}

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
    describe('Add user signature', () => {
        before(done => db.insert('users', sampleUser).then(() => done()));
        it('should require authentication', done => {
            request(app)
                .put('/users/signature')
                .expect(401)
                .end(done);
        });
        it('should require a signature', done => {
            request(app)
                .put('/users/signature')
                .set({authorization: 'FAKE TOKEN'})
                .expect(400)
                .end((err, result) => {
                    expect(result.body).to.eql({error: 'Invalid signature'});
                    done();
                });
        });
        it('should require a real user', done => {
            request(app)
                .put('/users/signature')
                .set({authorization: 'FAKE TOKEN'})
                .send({signature: 'I am an admin'})
                .expect(500)
                .end((err, result) => {
                    expect(result.body).to.eql({error: 'something went wrong'});
                    done();
                });
        });
        it('should set a signature for a user', done => {
            request(app)
                .put('/users/signature')
                .set({authorization: 'zyxwvut'})
                .send({signature: 'I am a sample'})
                .expect(500)
                .end((err, result) => {
                    expect(result.body).to.eql({
                        status: 'success',
                        data: { updated: true, signature: 'I am a sample' }
                    });
                    db.findOne('users', sampleUser)
                        .then(user => {
                            expect(user.signature).to.be('I am a sample');
                            done();
                        });
                });
        });
    });
    describe("Delete a member", () => {
        it('should require an ID', done => {
            request(app)
                .del('/users')
                .set({authorization: 'FAKE TOKEN'})
                .expect(404)
                .end(done);
        });
        it('should require admin authentication', done => {
            request(app)
                .del('/users/abc123')
                .set({authorization: 'zyxwvut'})
                .expect(401)
                .end(done);
        });
        it('should delete a user', done => {
            db.findOne('users', {id: 'abc123'})
                .then(user => {
                    expect(user.apiKey).to.be('zyxwvut');
                    request(app)
                        .del('/users/abc123')
                        .set({authorization: 'FAKE TOKEN'})
                        .expect(200)
                        .end((err, result) => {
                            expect(result.body.data).to.eql({removed: true});
                            db.findOne('users', {id: 'abc123'})
                              .then(usr => {
                                  expect(usr).not.to.be.ok();
                                  done();
                              })
                        });
                });

        });
        it('should let the user know if nothing was removed', done => {
            request(app)
                .del('/users/abc123')
                .set({authorization: 'FAKE TOKEN'})
                .expect(200)
                .end((err, result) => {
                    expect(result.body.data).to.eql({removed: false});
                    done();
                });
        });
    });
});
