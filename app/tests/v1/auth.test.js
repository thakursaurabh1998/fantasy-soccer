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
    describe('POST /auth/signup', () => {
        test('creates new user successfully', () => {
            const requestBody = {
                email: 'abc@gmail.com',
                password: 'hello123'
            };
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
    });
});
