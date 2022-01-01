const Joi = require('joi');

module.exports = {
    updateTeam: {
        body: Joi.object({
            name: Joi.string(),
            country: Joi.string()
        })
    },
    updatePlayer: {
        body: Joi.object({
            playerId: Joi.string().required(),
            firstName: Joi.string(),
            lastName: Joi.string(),
            country: Joi.string()
        })
    },
    transferPlayer: {
        body: Joi.object({
            playerId: Joi.string().required(),
            askingPrice: Joi.number().required()
        })
    }
};
