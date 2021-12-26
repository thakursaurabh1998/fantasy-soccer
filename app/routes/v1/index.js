const router = require('express').Router();

const controllers = require('../../controller').v1;

router.route('/login').post(controllers.login);

module.exports = router;
