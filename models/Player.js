const mongoose = require('mongoose');

const { playerTypes } = require('../utils/constants');

const { ObjectId } = mongoose.Schema;

const playerSchema = mongoose.Schema(
    {
        firstName: { type: String, required: true },
        lastName: String,
        age: { type: Number, required: true, min: 18, max: 40 },
        country: { type: String, required: true },
        type: {
            required: true,
            type: String,
            enum: Object.values(playerTypes)
        },
        value: Number,
        team: {
            type: ObjectId,
            ref: 'Team'
        },
        owner: {
            type: ObjectId,
            ref: 'User'
        },
        activeTransfer: {
            type: ObjectId,
            ref: 'Transfer'
        }
    },
    { timestamps: true }
);

playerSchema.methods.updateTeam = function (newTeam) {
    this.team = newTeam;
    return this.save();
};

const collection = 'players';
const Player = mongoose.model('Player', playerSchema, collection);

module.exports = Player;
