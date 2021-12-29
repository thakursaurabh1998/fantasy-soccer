const router = require('express').Router();

const {
    v1: { user }
} = require('../../controller');

router.route('/team').get(user.fetchTeam).post(user.updateTeam);
router.route('/player').post(user.updatePlayer);

module.exports = router;
