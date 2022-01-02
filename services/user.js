const { User } = require('../models');
const { isDuplicateKeyError, ServerError } = require('../utils/helper');
const { generatePlayers } = require('./player');
const { generateTeam } = require('./team');

/**
 * Create user and generate default team and random players
 * for initial setup
 * @param {String} email
 * @param {String} password
 */
async function createAndSetupUser(email, password) {
    try {
        const user = new User({ email, password });
        await user.save();
        const team = await generateTeam(user);
        const players = await generatePlayers(user);

        await team.addPlayersBulk(players);
    } catch (error) {
        if (isDuplicateKeyError(error.message)) {
            throw new ServerError(error, 400, 'User already exists');
        }
        throw error;
    }
}

module.exports = {
    createAndSetupUser
};
