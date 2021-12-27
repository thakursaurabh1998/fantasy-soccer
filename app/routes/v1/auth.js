const router = require('express').Router();

const {
    v1: { auth }
} = require('../../controller');

router.route('/signup').post(auth.signup);
router.route('/login').post(auth.login);

module.exports = router;
