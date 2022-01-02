const {
    Types: { ObjectId }
} = require('mongoose');

const { Team } = require('../models');
const { players, teams } = require('../utils/constants');

/**
 * Return team data for a user
 * @param {String} userId
 * @returns {Object}
 */
async function fetchTeamData(userId) {
    const [team] = await Team.aggregate([
        {
            $match: {
                owner: ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: 'players',
                let: { teamId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$team', '$$teamId']
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            playerId: '$_id',
                            firstName: 1,
                            lastName: 1,
                            age: 1,
                            country: 1,
                            type: 1,
                            value: 1,
                            activeTransfer: 1
                        }
                    }
                ],
                as: 'players'
            }
        },
        {
            $project: {
                _id: 0,
                teamId: '$_id',
                owner: 1,
                value: 1,
                country: 1,
                name: 1,
                budget: 1,
                players: 1
            }
        }
    ]);

    return team;
}

/**
 * Generate initial team for the user during signup
 * @param {User} user
 * @returns {Team}
 */
async function generateTeam(user) {
    const team = new Team({
        name: 'Default',
        country: 'Default',
        budget: teams.initialBudget,
        value: players.initialValue * players.initialCount,
        owner: user
    });

    await team.save();
    return team;
}

/**
 * Update meta data for a team
 * @param {User} user
 * @param {{ name: String, country: String }} updates
 * @returns {Team}
 */
async function updateTeamData(user, updates) {
    const { name, country } = updates;

    return Team.updateOne({ owner: user.userId }, { name, country });
}

module.exports = {
    fetchTeamData,
    generateTeam,
    updateTeamData
};
