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

teamSchema.methods.addPlayersBulk = async function (playerIds) {
    this.players.push(...playerIds);
    // add team to the player object also
    return Promise.all([this.save(), Player.updateMany({ _id: playerIds }, { team: this })]);
};

teamSchema.methods.removePlayers = function (playerIds) {
    return Promise.all([
        Team.updateOne({ _id: this._id }, { $pull: { players: { $in: playerIds } } }),
        Player.updateMany({ _id: playerIds }, { team: null })
    ]);
};

const collection = 'teams';
const Team = mongoose.model('Team', teamSchema, collection);

module.exports = Team;
