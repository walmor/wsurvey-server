import express from 'express';
import graphqlSetup from './graphql/setup';

const app = express();

graphqlSetup(app);

export default app;
