const User = require('../models/User');
const { ServerError, isDuplicateKeyError } = require('../utils/helper');

async function verifyCredentials(email, password) {
    const isUserVerified = await User.verifyCredentials(email, password);

    if (isUserVerified) {
        return true;
    }

    throw new ServerError('Verification failed', 401);
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
    verifyCredentials,
    createUserProfile
};
