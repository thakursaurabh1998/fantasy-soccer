const mongoose = require('mongoose');
const { randomBytes, scryptSync, timingSafeEqual } = require('crypto');

function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const hashedPassword = scryptSync(password, salt, 64).toString('hex');
    return { salt, hashedPassword };
}

const userSchema = mongoose.Schema(
    {
        email: {
            type: String,
            lowercase: true,
            index: true,
            unique: true
        },
        password: String,
        salt: String
    },
    { timestamps: true }
);

userSchema.statics.verifyCredentials = async function (email, password) {
    const user = await this.findOne({ email });

    if (!user) {
        return { isUserVerified: false };
    }

    const { salt, password: key } = user;

    const hashedBuffer = scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, 'hex');
    // using this particular function to compare hash values
    // is done to avoid timing attacks
    // explained: https://en.wikipedia.org/wiki/Timing_attack
    const match = timingSafeEqual(hashedBuffer, keyBuffer);

    return { isUserVerified: match, user };
};

userSchema.pre('save', function (next) {
    const { hashedPassword, salt } = hashPassword(this.password);
    this.password = hashedPassword;
    this.salt = salt;
    next();
});

const collection = 'users';
const User = mongoose.model('User', userSchema, collection);

module.exports = User;
