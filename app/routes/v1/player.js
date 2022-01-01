const router = require('express').Router();

const {
    v1: { player }
} = require('../../controller');

router.route('/transfers').get(player.transferList);

module.exports = router;
