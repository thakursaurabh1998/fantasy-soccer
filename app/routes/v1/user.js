const router = require('express').Router();

const {
    v1: { user }
} = require('../../controller');

router.route('/team').get(user.fetchTeam).post(user.updateTeam);

module.exports = router;
