import startDatabase from './database';
import startServer from './server';

/* eslint-disable no-console */

startDatabase()
  .then(() => startServer())
  .then((srv) => {
    console.log(`Server listening on port ${srv.address().port}.`);
  })
  .catch((err) => {
    console.error(`Error starting server: ${err}`);
  });
