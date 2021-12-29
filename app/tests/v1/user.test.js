/* eslint-disable jest/expect-expect */
const agent = require('supertest');
const Player = require('../../../models/Player');
const Team = require('../../../models/Team');
const User = require('../../../models/User');
const { teams, players } = require('../../../utils/constants');

const app = require('../../server');
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
});
