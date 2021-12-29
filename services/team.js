const {
    Types: { ObjectId }
} = require('mongoose');

const Team = require('../models/Team');
const { players, teams } = require('../utils/constants');
require('../models/Player');

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
                let: { players: '$players' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $in: ['$_id', '$$players']
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
                            value: 1
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

module.exports = {
    fetchTeamData,
    generateTeam
};
