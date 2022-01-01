const { player } = require('../../request-schema/v1');
const { player: playerService } = require('../../../services');
const { verifyRequestSchema, createResponse } = require('../../../utils/helper');

module.exports = {
    transferList: verifyRequestSchema(async (req, res, next) => {
        try {
            const transfers = await playerService.playerTransferList(req.query);
            res.json(createResponse(true, null, { transfers }));
        } catch (error) {
            next(error);
        }
    }, player.transferList)
};
