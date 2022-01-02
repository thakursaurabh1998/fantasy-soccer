const jwt = require('jsonwebtoken');

const config = require('../config');
const { User } = require('../models');
const { ServerError } = require('../utils/helper');

/**
 * create access token for user
 * @param {{ email: String, name: String, _id: String }} user
 * @returns {String}
 */
function createAccessToken(user) {
    const { email, name, _id: userId } = user;
    return jwt.sign({ email, name, userId }, config.auth.secret, { expiresIn: config.auth.ttl });
}

/**
 * verify token and get decoded value
 * @param {String} token
 * @returns {{ isVerified: Boolean, decoded: {email: String, userId: String} }}
 */
function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, config.auth.secret);
        return { isVerified: true, decoded };
    } catch (error) {
        return { isVerified: false };
    }
}

/**
 * Verify user credentials, password and email id matches the records
 * and create a JWT token
 * @param {String} email
 * @param {String} password
 * @returns {{ isUserVerified: Boolean, accessToken: String }}
 */
async function verifyCredentialsAndCreateToken(email, password) {
    const { isUserVerified, user } = await User.verifyCredentials(email, password);

    if (!isUserVerified) {
        throw new ServerError('Verification failed', 401);
    }

    const accessToken = createAccessToken(user);

    return { isUserVerified, accessToken };
}

module.exports = {
    verifyCredentialsAndCreateToken,
    verifyToken
};
