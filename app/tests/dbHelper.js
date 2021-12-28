const mongoose = require('mongoose');

const config = require('../../config');
const connections = require('../../utils/connections');

function prepareDb() {
    const connectionOptions = {
        mongo: { ...config.database, showDebug: false }
    };
    return connections.init(connectionOptions);
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
