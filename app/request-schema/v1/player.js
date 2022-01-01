const Joi = require('joi');

module.exports = {
    transferList: {
        query: Joi.object({
            page: Joi.number().default(1),
            count: Joi.number().default(10)
        })
    }
};
