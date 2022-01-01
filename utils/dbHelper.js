const mongoose = require('mongoose');

/**
 * Runs the provided function within a transaction block
 * @param {(any) => Promise<any>} transaction
 * @returns {Promise}
 */
async function withTransaction(transaction) {
    const session = await mongoose.startSession();
    await session.withTransaction(transaction);
    await session.endSession();
}

module.exports = {
    withTransaction
};
