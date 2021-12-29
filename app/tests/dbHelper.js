const mongoose = require('mongoose');

const config = require('../../config');
const connections = require('../../utils/connections');

async function prepareDb() {
    const connectionOptions = {
        mongo: { ...config.database, showDebug: false }
    };

    const dbConnection = await connections.init(connectionOptions);

    // this is a hack to ensure indexes are created before running tests
    await new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 1000);
    });

    return dbConnection;
}

async function dropCollections() {
    const db = mongoose.connection.db;
    // Get all collections
    const collections = await db.listCollections().toArray();
    // Create an array of collection names and drop each collection
    return Promise.all(collections.map((collection) => db.dropCollection(collection.name))).then(
        connections.close
    );
}

module.exports = {
    prepareDb,
    dropCollections
};
