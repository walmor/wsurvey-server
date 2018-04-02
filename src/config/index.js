import dotenv from 'dotenv';
import _ from 'lodash';
import path from 'path';

const env = process.env.NODE_ENV || 'dev';

dotenv.config({ path: path.resolve(__dirname, `.env.${env}`) });

const schema = {
  app: {
    port: parseInt(process.env.APP_PORT, 10) || 3000,
  },
  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 27017,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    authSource: process.env.DB_AUTH_SOURCE || 'admin',
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRESIN || '30d',
  },
};

// Default configurations
const defaults = {
  // dev environment
  dev: {
    db: {
      host: 'localhost',
      name: 'wsurvey-dev',
    },
  },

  // test environment
  test: {
    db: {
      host: 'localhost',
      name: 'wsurvey-test',
    },
  },
};

const config = _.merge({}, defaults[env], schema);

export default config;
