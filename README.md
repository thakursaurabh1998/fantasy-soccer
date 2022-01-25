# Soccer Manager

The application is deployed on heroku. [https://fantasy-soccer-th98.herokuapp.com](https://fantasy-soccer-th98.herokuapp.com)

You can also browse the API documentation on Postman. [https://documenter.getpostman.com/view/3481116/UVRHiiCC](https://documenter.getpostman.com/view/3481116/UVRHiiCC)

## Tech Stack

1. **NodeJS** - JavaScript engine for running back end JS code
1. **MongoDB** - Database, cloud service being used is Atlas by MongoDB
1. **Mongoose** - ODM for MongoDB
1. **ExpressJS** - Web Framework used to create API
1. **Jest and Supertest** - Testing framework
1. **Heroku** - For hosting the application

## Good design decisions

-   **Graceful Shutdown** of the API server, ensures that there is **no interruption** in request processing of the APIs in case of restart/redeploy.
-   Schema declaration using mongoose.
-   Request schema validation is done using Joi.

## Possible improvements

-   Typescript could have been used as the language of choice because of a lot of advantages, but because this was a small project I decided to go with JS which also helped in fast development. But I recommend using Typescript for big projects.

## Environment variables

-   `.env` file is used to set environment variables..
-   `.env` example is given in the [.env.example](./.env.example) file

## Testing

Following are the instructions to run tests:

To run these tests you should have a running Mongo DB service, add the URL in `.env` file.

```bash
source .env
npm install
npm test
```
