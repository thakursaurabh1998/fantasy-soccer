const { auth: authService } = require('../../../services');
const { verifyRequestSchema, createResponse, errorResponse } = require('../../../utils/helper');
const { logger } = require('../../../utils/logger');
const { auth } = require('../../request-schema/v1');

module.exports = {
    signup: verifyRequestSchema(async (req, res) => {
        const { email, password } = req.body;
        try {
            await authService.createUserProfile(email, password);
            res.json(createResponse(true));
        } catch (error) {
            logger.info(error);
            const { statusCode, response } = errorResponse(error);
            res.status(statusCode).json(response);
        }
    }, auth.signup),

    login: verifyRequestSchema(async (req, res) => {
        const { email, password } = req.body;

        try {
            const isUserVerified = await authService.verifyCredentials(email, password);
            res.json(createResponse(true, null, { verified: isUserVerified }));
        } catch (error) {
            logger.info(error);
            const { statusCode, response } = errorResponse(error);
            res.status(statusCode).json(response);
        }
    }, auth.login)
};
