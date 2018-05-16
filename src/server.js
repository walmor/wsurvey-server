import fs from 'fs';
import https from 'https';
import startDatabase from './database';
import config from './config';
import app from './app';

const sslOptions = {
  key: fs.readFileSync(config.ssl.keyFile),
  cert: fs.readFileSync(config.ssl.certFile),
  ca: config.ssl.caFile ? fs.readFileSync(config.ssl.caFile) : null,
  passphrase: config.ssl.passphrase,
};

/* eslint-disable no-console */

startDatabase()
  .then(() => https.createServer(sslOptions, app).listen(config.app.port))
  .then((srv) => {
    console.log(`Server listening on port ${srv.address().port}.`);
  })
  .catch((err) => {
    console.error(`Error starting server: ${err}`);
  });
