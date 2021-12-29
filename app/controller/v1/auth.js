const { auth: authService } = require('../../../services');
const { verifyRequestSchema, createResponse, errorResponse } = require('../../../utils/helper');
const { logger } = require('../../../utils/logger');
const { auth } = require('../../request-schema/v1');

module.exports = {
    signup: verifyRequestSchema(async (req, res, next) => {
        const { email, password } = req.body;
        try {
            await authService.createUserProfile(email, password);
            res.json(createResponse(true));
        } catch (error) {
            next(error);
        }
    }, auth.signup),

    login: verifyRequestSchema(async (req, res, next) => {
        const { email, password } = req.body;

        try {
            const { isUserVerified, accessToken } =
                await authService.verifyCredentialsAndCreateToken(email, password);
            res.json(createResponse(true, null, { verified: isUserVerified, accessToken }));
        } catch (error) {
            next(error);
        }
    }, auth.login),
};
