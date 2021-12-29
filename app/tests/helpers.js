const agent = require('supertest');

const app = require('../server');

async function signupAndLogin(credentials) {
    let token = null;
    await agent(app).post('/v1/auth/signup').send(credentials);
    await agent(app)
        .post('/v1/auth/login')
        .send(credentials)
        .then((response) => {
            token = response.body.data.accessToken;
        });
    return token;
}

module.exports = {
    signupAndLogin
};
