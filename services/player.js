const Player = require('../models/Player');
const { playerTypes, players } = require('../utils/constants');
const { getRandomInt, ServerError } = require('../utils/helper');

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

module.exports = {
    generatePlayers,
    updatePlayerData
};
