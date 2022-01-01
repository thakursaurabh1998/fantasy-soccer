const router = require('express').Router();

const authRouter = require('./auth');
const userRouter = require('./user');
const playerRouter = require('./player');
const {
    v1: { auth }
} = require('../../controller');

router.use('/auth', authRouter);

// verify user token for all the routes below this
router.use('*', auth.verifyToken);

router.use('/user', userRouter);
router.use('/players', playerRouter);

module.exports = router;
