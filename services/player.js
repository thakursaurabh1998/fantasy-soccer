const mongoose = require('mongoose');

const { Player, Transfer, Team } = require('../models');
const { playerTypes, players, transferStatus, errors } = require('../utils/constants');
const { withTransaction } = require('../utils/dbHelper');
const { getRandomInt, ServerError } = require('../utils/helper');

const { ObjectId } = mongoose.Types;

/**
 * Create a player after taking options or use default
 * values, used to create players after user signup
 * @param {Object} options
 * @param {Number} index
 * @returns {Player}
 */
function createPlayer(options = {}, index) {
    const {
        firstName = `Default FN_${index}`,
        lastName = `Default LN_${index}`,
        age = getRandomInt(18, 40),
        country = 'Default',
        type = playerTypes.attacker,
        value = players.initialValue,
        owner
    } = options;
    return new Player({
        firstName,
        lastName,
        age,
        country,
        type,
        value,
        owner
    });
}

/**
 * Generate random players and return inserted IDs
 * @param {User} user
 * @returns {Array<String>}
 */
async function generatePlayers(user) {
    let count = 1;
    const newPlayers = [];
    Object.values(playerTypes).forEach((playerType) => {
        for (let i = 0; i < players.initialCountByType[playerType]; i++) {
            newPlayers.push(createPlayer({ owner: user, type: playerType }, count));
            count += 1;
        }
    });

    const saveResponse = await Player.bulkSave(newPlayers);

    return saveResponse.result.insertedIds.map((insertedId) => insertedId._id);
}

/**
 * Update player meta fields
 * @param {User} user
 * @param {String} playerId
 * @param {{ firstName: String, lastName: String, country: String }} updates
 */
async function updatePlayerData(user, playerId, updates) {
    const { firstName, lastName, country } = updates;

    const updateStatus = await Player.updateOne(
        { owner: user.userId, _id: playerId },
        { firstName, lastName, country }
    );

    if (updateStatus.matchedCount < 1) {
        throw new ServerError('Player not found for the user', 400);
    }
}

/**
 * Open a transfer of a player
 * @param {User} user
 * @param {String} playerId
 * @param {{ askingPrice: Number }} transferOptions
 * @returns
 */
async function openTransfer(user, playerId, transferOptions) {
    const { userId } = user;
    const { askingPrice } = transferOptions;

    const player = await Player.findOne({
        _id: ObjectId(playerId),
        owner: ObjectId(userId)
    });

    if (!player) {
        throw new ServerError('Player does not exist', 400);
    }

    if (player.activeTransfer) {
        throw new ServerError(errors.ActiveTransferExists, 400);
    }

    if (player.value > askingPrice) {
        throw new ServerError('Asking Price is less than player value', 400);
    }

    const newTransfer = new Transfer({
        player: playerId,
        seller: userId,
        askingPrice,
        status: transferStatus.PENDING
    });

    await newTransfer.save();
    await Player.updateOne({ _id: playerId }, { activeTransfer: newTransfer });

    return {
        askingPrice: newTransfer.askingPrice,
        player: newTransfer.player,
        seller: newTransfer.seller,
        status: newTransfer.status,
        transferId: newTransfer._id
    };
}

/**
 * Increase the player value to a random
 * percentage between 10 and 100
 * @param {Number} oldPrice
 * @returns {Number}
 */
function increasedPlayerValue(oldPrice) {
    const randomPercent = getRandomInt(10, 100);
    const newPrice = (oldPrice * (100 + randomPercent)) / 100;

    return newPrice;
}

/**
 * Get all open player transfers with page number
 * and required document count
 * @param {{ count: Number, page: Number }} pageOptions
 * @returns {Array<Transfer>}
 */
function playerTransferList(pageOptions) {
    const { count, page } = pageOptions;
    const skipDocuments = count * (page - 1);
    // return Transfer.find({ status: transferStatus.PENDING }).skip(skipDocuments).limit(count);
    return Transfer.aggregate([
        {
            $match: {
                status: transferStatus.PENDING
            }
        },
        {
            $skip: skipDocuments
        },
        {
            $limit: count
        },
        {
            $project: {
                _id: 0,
                transferId: '$_id',
                player: 1,
                seller: 1,
                askingPrice: 1,
                status: 1,
                createdAt: 1
            }
        }
    ]);
}

/**
 * Buys a specific player after doing all the validations
 * Updates all dependent fields in Team and Player collections
 * @param {User} user
 * @param {String} playerId
 * @returns {Player}
 */
async function buy(user, playerId) {
    const { userId: buyerId } = user;
    const [player, transferData, buyerTeam] = await Promise.all([
        Player.findOne({ _id: playerId, activeTransfer: { $exists: true } }),
        Transfer.findOne({
            player: playerId,
            status: transferStatus.PENDING
        }),
        Team.findOne({ owner: buyerId })
    ]);

    if (!player) {
        throw new ServerError('Player not available for buying', 400);
    }
    if (player.owner.toString() === buyerTeam.owner.toString()) {
        throw new ServerError("Can't buy your own player", 400);
    }
    if (transferData.askingPrice > buyerTeam.budget) {
        throw new ServerError('Team budget is less than player asking price', 400);
    }

    const sellerTeam = await Team.findOne({ owner: transferData.seller });

    // update the player transfer status
    transferData.status = transferStatus.COMPLETE;
    // subtract the player price from the buyer team budget
    buyerTeam.budget -= transferData.askingPrice;
    // add the selling price to the budget of seller team
    sellerTeam.budget += transferData.askingPrice;
    // reduce the team value with the original player value
    sellerTeam.value -= player.value;
    // update buyer value in transfer data
    transferData.buyer = buyerId;

    const newPlayerValue = increasedPlayerValue(player.value);
    buyerTeam.value += newPlayerValue;
    // placement of this matters
    player.value = newPlayerValue;

    // update player owner and team data
    player.team = buyerTeam._id;
    player.owner = buyerId;
    // remove active transfer key from user
    player.activeTransfer = undefined;

    await withTransaction(async () => {
        await transferData.save();
        await player.save();
        await buyerTeam.save();
        await sellerTeam.save();
    });

    const { age, country, firstName, lastName, updatedAt, owner, team, type, value } = player;

    return {
        playerId,
        age,
        country,
        firstName,
        lastName,
        updatedAt,
        owner,
        team,
        type,
        value
    };
}

module.exports = {
    buy,
    generatePlayers,
    openTransfer,
    playerTransferList,
    updatePlayerData
};
