const Joi = require('joi');

module.exports = {
    updateTeam: {
        body: Joi.object({
            name: Joi.string(),
            country: Joi.string()
        })
    }
};
