const jwt = require('jsonwebtoken');

const config = require('../config');
const { User } = require('../models');
const { ServerError } = require('../utils/helper');

function createAccessToken(user) {
    const { email, name, _id: userId } = user;
    return jwt.sign({ email, name, userId }, config.auth.secret, { expiresIn: config.auth.ttl });
}

function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, config.auth.secret);
        return { isVerified: true, decoded };
    } catch (error) {
        return { isVerified: false };
    }
}

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
