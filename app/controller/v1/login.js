const { login } = require('../../../services');

module.exports = async (_req, res) => {
    res.json({ hello: 'world', ok: await login() });
};
