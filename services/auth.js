const jwt = require('jsonwebtoken');

const config = require('../config');
const User = require('../models/User');
const { ServerError, isDuplicateKeyError } = require('../utils/helper');

function createAccessToken(user) {
    const { email, name } = user;
    return jwt.sign({ email, name }, config.auth.secret, { expiresIn: config.auth.ttl });
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

async function createUserProfile(email, password) {
    const user = new User({ email, password });
    try {
        await user.save();
    } catch (error) {
        if (isDuplicateKeyError(error.message)) {
            throw new ServerError(error, 400, 'User already exists');
        }
    }
}

module.exports = {
    verifyCredentialsAndCreateToken,
    verifyToken,
    createUserProfile
};
