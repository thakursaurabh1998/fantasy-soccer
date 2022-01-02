/* eslint-disable jest/expect-expect */
const agent = require('supertest');

const app = require('../../server');
const { Player, Team, Transfer, User } = require('../../../models');
const { teams, players, transferStatus } = require('../../../utils/constants');
const { prepareDb, dropCollections } = require('../dbHelper');
const { signupAndLogin } = require('../helpers');

beforeAll(async () => {
    await prepareDb();
});

afterAll(async () => {
    await dropCollections();
});

describe('Test user APIs', () => {
    let token = null;
    const credentials = {
        email: 'usertest@gmail.com',
        password: 'hello123'
    };

    beforeAll(async () => {
        token = await signupAndLogin(credentials);
    });

    describe('GET /user/team', () => {
        it('returns team data correctly', () => {
            return agent(app)
                .get('/v1/user/team')
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then((response) => {
                    expect(response.body.data.team).toBeTruthy();
                    expect(response.body.data.team).toEqual({
                        value: 20000000,
                        teamId: expect.any(String),
                        budget: teams.initialBudget,
                        country: 'Default',
                        name: 'Default',
                        owner: expect.anything(),
                        players: expect.arrayContaining([
                            expect.objectContaining({
                                age: expect.any(Number),
                                country: 'Default',
                                firstName: expect.stringContaining('Default FN_'),
                                lastName: expect.stringContaining('Default LN_'),
                                playerId: expect.any(String),
                                type: expect.any(String),
                                value: players.initialValue
                            })
                        ])
                    });
                    expect(response.body.data.team.players.length).toBe(20);
                });
        });
    });

    describe('POST /user/team', () => {
        it('updates name and country of the team correctly', () => {
            const newTeamName = 'SuperHuman';
            const newCountry = 'India';

            return agent(app)
                .post('/v1/user/team')
                .set('Authorization', `Bearer ${token}`)
                .send({ name: newTeamName, country: newCountry })
                .expect(200)
                .expect({ success: true })
                .then(async () => {
                    const user = await User.findOne({ email: credentials.email });
                    const team = await Team.findOne({ owner: user._id });

                    expect(team.country).toBe(newCountry);
                    expect(team.name).toBe(newTeamName);
                });
        });
    });

    describe('POST /user/player', () => {
        it('fails if playerId is invalid (player not present for this user)', async () => {
            return agent(app)
                .post('/v1/user/player')
                .set('Authorization', `Bearer ${token}`)
                .send({ playerId: '61ccce112f6123547a94c643' })
                .expect(400)
                .expect({ success: false, errors: ['Player not found for the user'] });
        });

        it('updates player meta correctly', async () => {
            const newCountry = 'India';
            const newFirstName = 'Steve';
            const newLastName = 'Burr';

            const player = await Player.findOne();

            return agent(app)
                .post('/v1/user/player')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    playerId: player._id,
                    firstName: newFirstName,
                    lastName: newLastName,
                    country: newCountry
                })
                .expect(200)
                .expect({ success: true })
                .then(async () => {
                    const updatedPlayer = await Player.findOne({ _id: player._id });
                    expect(updatedPlayer.country).toBe(newCountry);
                    expect(updatedPlayer.firstName).toBe(newFirstName);
                    expect(updatedPlayer.lastName).toBe(newLastName);
                });
        });
    });

    describe('PUT /user/transfer-player', () => {
        let player = null;
        let user = null;
        let expectedTransfer = null;

        beforeAll(async () => {
            player = await Player.findOne();
            user = await User.findOne({ email: credentials.email });
            expectedTransfer = {
                player: player._id.toString(),
                seller: user._id.toString(),
                askingPrice: 1234560,
                status: 'PENDING',
                transferId: expect.any(String)
            };
        });

        it('fails if asking price is less than player value', () => {
            return agent(app)
                .put('/v1/user/transfer-player')
                .set('Authorization', `Bearer ${token}`)
                .send({ playerId: player._id, askingPrice: 10000 })
                .expect(400)
                .then((response) => {
                    expect(response.body.success).toBe(false);
                    expect(response.body.errors).toEqual([
                        'Asking Price is less than player value'
                    ]);
                });
        });

        it('returns the correct response', async () => {
            return agent(app)
                .put('/v1/user/transfer-player')
                .set('Authorization', `Bearer ${token}`)
                .send({ playerId: player._id, askingPrice: 1234560 })
                .expect(200)
                .then((response) => {
                    expect(response.body.success).toBe(true);
                    expect(response.body.data).toEqual({
                        transfer: expectedTransfer
                    });
                });
        });

        it('adds the player in the transfer list', async () => {
            const transfers = await Transfer.find({ seller: user._id }).lean();

            expect(transfers.length).toBe(1);
            expect(transfers[0]).toEqual(
                expect.objectContaining({
                    player: player._id,
                    seller: user._id,
                    askingPrice: 1234560,
                    status: 'PENDING'
                })
            );
        });

        it('asking price is set for a player', async () => {
            const transfers = await Transfer.find({ seller: user._id });
            expect(transfers[0].askingPrice).toBe(expectedTransfer.askingPrice);
        });
    });

    describe('PUT /user/buy-player', () => {
        let buyerToken = null;
        let initialPlayerObject = null;
        let buyer = null;
        let buyerTeam = null;
        let transfer = null;
        const buyerCredentials = {
            email: 'buyercredentials@gmail.com',
            password: 'hello123'
        };

        beforeAll(async () => {
            initialPlayerObject = await Player.findOne({ activeTransfer: { $exists: true } });
            buyerToken = await signupAndLogin(buyerCredentials);
            buyer = await User.findOne({ email: buyerCredentials.email });
            buyerTeam = await Team.findOne({ owner: buyer });
            transfer = await Transfer.findOne({
                seller: initialPlayerObject.owner,
                status: transferStatus.PENDING
            });
        });

        it('fails if player not up for transfer', async () => {
            const notForTransferPlayer = await Player.findOne({
                activeTransfer: { $exists: false }
            });

            return agent(app)
                .put('/v1/user/buy-player')
                .set('Authorization', `Bearer ${buyerToken}`)
                .send({ playerId: notForTransferPlayer._id })
                .expect(400)
                .expect((response) => {
                    expect(response.body.success).toBe(false);
                    expect(response.body.errors).toEqual(['Player not available for buying']);
                });
        });

        it('should not let you buy your own player on transfer list', async () => {
            const owner = await User.findOne({ email: credentials.email });
            const ownPlayerOnTransferList = await Player.findOne({ owner });

            return agent(app)
                .put('/v1/user/buy-player')
                .set('Authorization', `Bearer ${token}`)
                .send({ playerId: ownPlayerOnTransferList._id })
                .expect(400)
                .expect((response) => {
                    expect(response.body.success).toBe(false);
                    expect(response.body.errors).toEqual(["Can't buy your own player"]);
                });
        });

        it('should not let you buy if budget is less than asking price', async () => {
            await Team.updateOne({ owner: buyer }, { $set: { budget: 0 } });
            return agent(app)
                .put('/v1/user/buy-player')
                .set('Authorization', `Bearer ${buyerToken}`)
                .send({ playerId: initialPlayerObject._id })
                .expect(400)
                .expect((response) => {
                    expect(response.body.success).toBe(false);
                    expect(response.body.errors).toEqual([
                        'Team budget is less than player asking price'
                    ]);
                });
        });

        it('does the API call correctly', async () => {
            await Team.updateOne({ owner: buyer }, { $set: { budget: teams.initialBudget } });

            return agent(app)
                .put('/v1/user/buy-player')
                .set('Authorization', `Bearer ${buyerToken}`)
                .send({ playerId: initialPlayerObject._id })
                .expect(200)
                .expect((response) => {
                    expect(response.body.success).toBe(true);
                    expect(response.body.data.player).toMatchObject({
                        playerId: initialPlayerObject._id,
                        age: expect.any(Number),
                        country: 'India',
                        firstName: 'Steve',
                        lastName: 'Burr',
                        owner: buyer._id,
                        team: buyerTeam._id,
                        type: expect.stringMatching(/^(attacker|defender|goalkeeper|midfielder)/),
                        updatedAt: expect.any(String),
                        value: expect.any(Number)
                    });
                });
        });

        it('updates the player team data', async () => {
            const updatedPlayer = await Player.findOne({
                _id: initialPlayerObject._id,
                activeTransfer: { $exists: false }
            });
            expect(updatedPlayer.owner).toEqual(buyer._id);
            expect(updatedPlayer.team).toEqual(buyerTeam._id);
        });

        it('player value is increased between 10-100 percent', async () => {
            const updatedPlayer = await Player.findOne({
                _id: initialPlayerObject._id,
                activeTransfer: { $exists: false }
            });

            const { value: playerUpdatedValue } = updatedPlayer;
            const { value: playerOldValue } = initialPlayerObject;

            const increasedPercentage =
                ((playerUpdatedValue - playerOldValue) / playerOldValue) * 100;

            expect(increasedPercentage).toBeGreaterThanOrEqual(10);
            expect(increasedPercentage).toBeLessThanOrEqual(100);
        });

        it('updates the seller and buyer team budget', async () => {
            const sellerTeam = await Team.findOne({ owner: initialPlayerObject.owner });
            const updatedBuyerTeam = await Team.findById(buyerTeam._id);

            expect(sellerTeam.budget).toBe(teams.initialBudget + transfer.askingPrice);
            expect(updatedBuyerTeam.budget).toBe(teams.initialBudget - transfer.askingPrice);
        });

        it('updates the seller and buyer team value', async () => {
            const sellerTeam = await Team.findOne({ owner: initialPlayerObject.owner });
            const updatedBuyerTeam = await Team.findById(buyerTeam._id);
            const updatedPlayer = await Player.findOne({
                _id: initialPlayerObject._id,
                activeTransfer: { $exists: false }
            });

            const initialTeamValue = players.initialValue * players.initialCount;
            expect(sellerTeam.value).toBe(initialTeamValue - initialPlayerObject.value);
            expect(updatedBuyerTeam.value).toBe(initialTeamValue + updatedPlayer.value);
        });
    });
});
