const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema;

const teamSchema = mongoose.Schema(
    {
        owner: {
            type: ObjectId,
            ref: 'User',
            unique: true,
            index: true
        },
        value: Number,
        country: String,
        name: String,
        budget: Number,
        players: [
            {
                type: ObjectId,
                ref: 'Player'
            }
        ]
    },
    { timestamps: true }
);

const collection = 'teams';
const Team = mongoose.model('Team', teamSchema, collection);

module.exports = Team;
