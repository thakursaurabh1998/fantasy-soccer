const { auth } = require('../../request-schema/v1');
const { auth: authService } = require('../../../services');
const { verifyRequestSchema, createResponse, ServerError } = require('../../../utils/helper');

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

    verifyToken: (req, res, next) => {
        const bearerToken = req.header('authorization')?.substring(7);

        const { isVerified, decoded: userData } = authService.verifyToken(bearerToken);

        if (isVerified) {
            res.locals.user = userData;
            next();
        } else {
            next(new ServerError('User not verified', 401));
        }
    }
};
