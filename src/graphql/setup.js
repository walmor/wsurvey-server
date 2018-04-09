import bodyParser from 'body-parser';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import schema from './schema';
import services from '../services';

export default function graphqlSetup(app) {
  // The GraphQL endpoint
  app.use(
    '/graphql',
    bodyParser.json(),
    graphqlExpress({
      schema,
      context: {
        services,
      },
      formatError(err) {
        return {
          message: err.message,
          code: err.originalError && err.originalError.code,
        };
      },
    }),
  );

  // GraphiQL, a visual editor for queries
  app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));
}
