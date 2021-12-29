const express = require('express');
const bodyParser = require('body-parser');

const routes = require('./routes');
const { createResponse, errorResponse } = require('../utils/helper');
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
    const { statusCode, response } = errorResponse(err);
    if (statusCode >= 500) {
        logger.error(err);
    } else {
        logger.info(err);
    }
    res.status(statusCode).json(response);
});

module.exports = app;
