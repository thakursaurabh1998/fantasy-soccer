const mongoose = require('mongoose');

const { transferStatus } = require('../utils/constants');

const { ObjectId } = mongoose.Schema;

const transferSchema = mongoose.Schema(
    {
        player: {
            type: ObjectId,
            ref: 'Player'
        },
        seller: {
            type: ObjectId,
            ref: 'User'
        },
        buyer: {
            type: ObjectId,
            ref: 'User'
        },
        askingPrice: Number,
        status: {
            type: String,
            enum: Object.values(transferStatus)
        }
    },
    { timestamps: true }
);

const collection = 'transfers';
const Transfer = mongoose.model('Transfer', transferSchema, collection);

module.exports = Transfer;
