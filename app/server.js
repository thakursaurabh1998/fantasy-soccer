const express = require('express');
const bodyParser = require('body-parser');

const config = require('./config');
const routes = require('./routes');
const { createResponse } = require('../utils/helper');
const { requestLogger, logger } = require('../utils/logger');

const app = express();

app.use(requestLogger);
app.use(bodyParser.json());

app.get('/health', (_req, res) => {
    res.status(200).json(createResponse(true, null, "I'm Healthy!"));
});

app.use('/v1/', routes.v1);

app.use((_req, res) => {
    res.status(404).json(createResponse(false, ['Not Found']));
});

app.use((err, _req, res, _next) => {
    logger.fatal({
        type: 'INTERNAL_SERVER_ERROR',
        err
    });
    res.status(500).json({
        data: "Something isn't right"
    });
});

let server = null;

module.exports = {
    start: () => {
        server = app.listen(config.server.port);
        logger.info(`API running on port - ${config.server.port}`);
    },

    // manage graceful shutdown with this function
    stop: () => {
        if (!server) {
            throw new Error('Server not started yet');
        }
        server.close();
    }
};
