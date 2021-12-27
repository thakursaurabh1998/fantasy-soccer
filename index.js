const config = require('./config');
const connections = require('./utils/connections');
const server = require('./app/server');
const { logger } = require('./utils/logger');

const connectionOptions = {
    mongo: config.database
};

connections.init(connectionOptions).then(server.start).catch(logger.fatal);

function handleKillSignals(signal) {
    logger.info(`${signal} SIGNAL RECEIVED`);
    connections.close().then(server.stop).catch(logger.fatal);
    logger.info('HTTP Server closed');
}

process.on('SIGINT', handleKillSignals);
process.on('SIGTERM', handleKillSignals);
process.on('uncaughtException', logger.fatal);
