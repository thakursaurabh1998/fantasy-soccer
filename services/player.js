const mongoose = require('mongoose');

const { Player, Transfer, Team } = require('../models');
const { playerTypes, players, transferStatus, errors } = require('../utils/constants');
const { withTransaction } = require('../utils/dbHelper');
const { getRandomInt, ServerError } = require('../utils/helper');

const { ObjectId } = mongoose.Types;

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

function increasedPlayerValue(oldPrice) {
    const randomPercent = getRandomInt(10, 100);
    const newPrice = (oldPrice * (100 + randomPercent)) / 100;

    return newPrice;
}

function playerTransferList(pageOptions) {
    const { count, page } = pageOptions;
    const skipDocuments = count * (page - 1);
    return Transfer.find({ status: transferStatus.PENDING }).skip(skipDocuments).limit(count);
}

async function transfer(user, playerId) {
    const { userId: buyerId } = user;
    const [player, transferData, buyerTeam] = await Promise.all([
        Player.findOne({ _id: playerId }),
        Transfer.findOne({
            player: playerId,
            status: transferStatus.PENDING
        }),
        Team.findOne({ owner: buyerId })
    ]);

    if (transferData.askingPrice > buyerTeam.budget) {
        throw new ServerError('Team budget is less than player asking price', 400);
    }

    // update the player transfer status
    transferData.status = transferStatus.COMPLETE;
    // subtract the player price from the buyer team budget
    buyerTeam.budget -= transferData.askingPrice;

    // calculate the new increase player value
    const newPlayerValue = increasedPlayerValue(transferData.askingPrice);
    buyerTeam.value += newPlayerValue;
    player.value = newPlayerValue;

    await withTransaction(async () => {
        await Player.updateOne(
            {
                _id: playerId
            },
            {
                owner: buyerId,
                team: buyerTeam
            }
        );
        await transferData.save();
        await player.save();
    });
}

module.exports = {
    transfer,
    generatePlayers,
    openTransfer,
    playerTransferList,
    updatePlayerData
};
