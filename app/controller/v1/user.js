const { user } = require('../../request-schema/v1');
const { team: teamService, player: playerService } = require('../../../services');
const { verifyRequestSchema, createResponse } = require('../../../utils/helper');

module.exports = {
    fetchTeam: verifyRequestSchema(async (_req, res, next) => {
        const { user } = res.locals;
        try {
            const team = await teamService.fetchTeamData(user.userId);
            res.json(createResponse(true, null, { team }));
        } catch (error) {
            next(error);
        }
    }),

    updateTeam: verifyRequestSchema(async (req, res, next) => {
        const { user } = res.locals;
        try {
            await teamService.updateTeamData(user, req.body);
            res.json(createResponse(true));
        } catch (error) {
            next(error);
        }
    }, user.updateTeam),

    updatePlayer: verifyRequestSchema(async (req, res, next) => {
        const { user } = res.locals;
        const { playerId, ...updates } = req.body;
        try {
            await playerService.updatePlayerData(user, playerId, updates);
            res.json(createResponse(true));
        } catch (error) {
            next(error);
        }
    }, user.updatePlayer)
};
