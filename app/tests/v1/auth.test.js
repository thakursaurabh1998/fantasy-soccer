/* eslint-disable jest/expect-expect */
const agent = require('supertest');
const User = require('../../../models/User');

const app = require('../../server');
const { prepareDb, dropCollections } = require('../dbHelper');
require('../dbHelper');

beforeAll(async () => {
    await prepareDb();
});

afterAll(async () => {
    await dropCollections();
});

describe('Test auth signup API', () => {
    const requestBody = {
        email: 'abc@gmail.com',
        password: 'hello123'
    };
    describe('POST /auth/signup', () => {
        it('fails if email id invalid', () => {
            return agent(app)
                .post('/v1/auth/signup')
                .send({ ...requestBody, email: 'rubbis@com' })
                .expect(400)
                .expect({
                    success: false,
                    errors: ['"email" must be a valid email'],
                    data: null,
                    errorType: 'ValidationError'
                });
        });
        it('creates new user successfully', () => {
            return agent(app)
                .post('/v1/auth/signup')
                .send(requestBody)
                .expect(200)
                .expect({ success: true })
                .then(async () => {
                    const userCount = await User.findOne({ email: requestBody.email }).count();
                    expect(userCount).toBe(1);
                });
        });

        it('returns appropriate message if user already exists', () => {
            return agent(app)
                .post('/v1/auth/signup')
                .send(requestBody)
                .expect(400)
                .expect({ success: false, errors: ['User already exists'] });
        });
    });

    describe('POST /auth/login', () => {
        beforeAll(async () => {
            if ((await User.count()) < 1) {
                await new User(requestBody).save();
            }
        });

        it('logins the user if user data is correct', () => {
            return agent(app)
                .post('/v1/auth/login')
                .send(requestBody)
                .expect(200)
                .then((response) => {
                    expect(response.body.success).toBe(true);
                    expect(response.body.data).toEqual(
                        expect.objectContaining({ verified: true, accessToken: expect.anything() })
                    );
                });
        });

        it('fails if the user credentials are wrong', () => {
            return agent(app)
                .post('/v1/auth/login')
                .send({ ...requestBody, password: 'rubbish' })
                .expect(401)
                .expect({ success: false, errors: ['Verification failed'] });
        });

        it('fails if the user email not present', () => {
            return agent(app)
                .post('/v1/auth/login')
                .send({ ...requestBody, email: 'cde@gmail.com' })
                .expect(401)
                .expect({ success: false, errors: ['Verification failed'] });
        });
    });
});
