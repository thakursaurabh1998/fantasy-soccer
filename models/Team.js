const mongoose = require('mongoose');
const Player = require('./Player');

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
        budget: Number
    },
    { timestamps: true }
);

teamSchema.methods.addPlayersBulk = async function (playerIds) {
    // add team to the player object also
    return Player.updateMany({ _id: playerIds }, { team: this });
};

teamSchema.methods.removePlayers = function (playerIds) {
    return Player.updateMany({ _id: playerIds }, { team: null });
};

const collection = 'teams';
const Team = mongoose.model('Team', teamSchema, collection);

module.exports = Team;
