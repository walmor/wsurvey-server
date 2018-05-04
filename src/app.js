import express from 'express';
import cors from 'cors';
import graphqlSetup from './graphql/setup';

const app = express();

app.use(cors());

graphqlSetup(app);

export default app;
