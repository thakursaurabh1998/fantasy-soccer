const mongoose = require('mongoose');

const { logger } = require('./logger');

function getMongoConnection(uri, showDebug = true) {
    const { connection } = mongoose;
    mongoose.Promise = global.Promise;

    mongoose.set('debug', showDebug);
    mongoose.connect(uri, (err) => {
        if (err) {
            logger.fatal(err);
        }
    });

    return connection;
}

let dbConnection = null;

function initMongoConnection(options) {
    dbConnection = getMongoConnection(options.url, options.showDebug);
    return new Promise((resolve) => {
        dbConnection.once('open', () => resolve(dbConnection));
        dbConnection.on('open', () => {
            logger.info('Mongo DB connection open');
        });
        dbConnection.on('close', () => {
            logger.info('Mongo DB connection closed!');
        });
        dbConnection.on('error', logger.fatal);
    });
}

module.exports = {
    init: (options) => {
        return initMongoConnection(options.mongo);
    },
    close: async () => {
        await dbConnection.close();
    }
};
