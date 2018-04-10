import bodyParser from 'body-parser';
import jwt from 'express-jwt';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import schema from './schema';
import services from '../services';
import * as err from '../services/errors/error-constants';
import config from '../config';

const GraphQLEndpoint = '/graphql';
const GraphiQLEndpoint = '/graphiql';

function verifyJsonWebToken() {
  return [
    jwt({
      secret: config.jwt.secret,
      requestProperty: 'auth',
      credentialsRequired: false,
    }),
    function (error, req, res, next) {
      if (error.name === 'UnauthorizedError') {
        const output = {
          error: err.INVALID_AUTH_TOKEN,
        };

        res
          .status(401)
          .set('Content-Type', 'application/json')
          .send(output);
      }

      next(error);
    },
  ];
}

function setCurrentUser() {
  return async (req, res, next) => {
    if (req.auth && req.auth.user) {
      const userId = req.auth.user.id;
      const { authService } = services;

      req.user = await authService.findUserById(userId);
    }

    next();
  };
}

function setupGraphQLEndpoint() {
  return [
    bodyParser.json(),
    graphqlExpress(req => ({
      schema,
      context: {
        user: req.user,
        services,
      },
      formatError(e) {
        return {
          message: e.message,
          code: e.originalError && e.originalError.code,
        };
      },
    })),
  ];
}

function setupGraphiQLEndpoint() {
  return graphiqlExpress({ endpointURL: GraphQLEndpoint });
}

export default function graphqlSetup(app) {
  app.use(GraphQLEndpoint, verifyJsonWebToken());
  app.use(GraphQLEndpoint, setCurrentUser());
  app.use(GraphQLEndpoint, setupGraphQLEndpoint());
  app.use(GraphiQLEndpoint, setupGraphiQLEndpoint());
}
