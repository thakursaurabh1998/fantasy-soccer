/* eslint-disable jest/expect-expect */
const agent = require('supertest');

const app = require('../../server');
const { Player, User } = require('../../../models');
const { prepareDb, dropCollections } = require('../dbHelper');
const { signupAndLogin } = require('../helpers');

beforeAll(async () => {
    await prepareDb();
});

afterAll(async () => {
    await dropCollections();
});

describe('Test player APIs', () => {
    let token = null;
    let players = null;
    let user = null;
    const credentials = {
        email: 'playertest@gmail.com',
        password: 'hello123'
    };

    beforeAll(async () => {
        token = await signupAndLogin(credentials);
        user = await User.findOne({ email: credentials.email });
        players = await Player.find().limit(3);
        await Promise.all(
            players.map(async (player) =>
                agent(app)
                    .put('/v1/user/transfer-player')
                    .set('Authorization', `Bearer ${token}`)
                    .send({ playerId: player._id, askingPrice: 1234560 })
            )
        );
    });

    describe('GET /player/transfers', () => {
        it('should return correct list of transfers', () => {
            return agent(app)
                .get('/v1/players/transfers')
                .set('Authorization', `Bearer ${token}`)
                .query({ count: 1, page: 1 })
                .expect(200)
                .then((response) => {
                    expect(response.body.success).toBe(true);
                    expect(response.body.data.transfers[0]).toMatchObject({
                        player: players[0]._id,
                        seller: user._id,
                        askingPrice: 1234560,
                        status: 'PENDING',
                        createdAt: expect.any(String),
                        transferId: expect.any(String)
                    });
                });
        });

        it('should paginate correctly', () => {
            return agent(app)
                .get('/v1/players/transfers')
                .set('Authorization', `Bearer ${token}`)
                .query({ count: 3, page: 1 })
                .expect(200)
                .then((response) => {
                    expect(response.body.data.transfers.length).toBe(3);
                });
        });
    });
});
