import express from 'express';
import config from './config';
import graphqlSetup from './graphql/setup';

export default async function startServer() {
  const app = express();

  graphqlSetup(app);

  return app.listen(config.app.port);
}
