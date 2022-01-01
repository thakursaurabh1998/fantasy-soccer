const playerTypes = {
    goalkeeper: 'goalkeeper',
    defender: 'defender',
    midfielder: 'midfielder',
    attacker: 'attacker'
};

const transferStatus = {
    PENDING: 'PENDING',
    COMPLETE: 'COMPLETE'
};

const players = {
    initialValue: 1000000,
    initialCount: 20,
    initialCountByType: {
        [playerTypes.attacker]: 5,
        [playerTypes.defender]: 6,
        [playerTypes.goalkeeper]: 3,
        [playerTypes.midfielder]: 6
    }
};

const teams = {
    initialBudget: 5000000
};

const errors = {
    ActiveTransferExists: 'ActiveTransferExists'
};

module.exports = {
    playerTypes,
    transferStatus,
    players,
    teams,
    errors
};
