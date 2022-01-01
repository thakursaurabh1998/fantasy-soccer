require('./models');
const config = require('./config');
const connections = require('./utils/connections');
const app = require('./app/server');
const { logger } = require('./utils/logger');

let serverConnection = null;

const server = {
    start: () => {
        serverConnection = app.listen(config.server.port);
        logger.info(`API running on port - ${config.server.port}`);
    },

    // manage graceful shutdown with this function
    stop: () => {
        if (!serverConnection) {
            throw new Error('Server not started yet');
        }
        serverConnection.close();
    }
};

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
