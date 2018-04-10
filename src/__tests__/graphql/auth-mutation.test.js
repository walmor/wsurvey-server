import supertest from 'supertest';
import FB from 'fb';
import app from '../../app';
import * as mongodbInMemory from '../utils/mongodb-in-memory';
import * as err from '../../services/errors/error-constants';
import userRepository from '../../repositories/mongoose/user-repository';
import config from '../../config';
import '../utils/custom-expects';

let request;

beforeAll(async () => {
  await mongodbInMemory.init();
  request = supertest(app);
});

afterAll(async () => {
  await mongodbInMemory.stop();
});

beforeEach(async () => {
  await mongodbInMemory.clearDatabase();
});

async function postQuery(query) {
  return request
    .post('/graphql')
    .set('Accept', 'application/json')
    .send(query);
}

async function getFacebookTestUser() {
  const cf = config.facebook;

  await FB.options({
    version: cf.apiVersion,
    accessToken: cf.appAccessToken(),
  });

  const { data } = await FB.api(`/${cf.appId}/accounts/test-users`);

  const { id, access_token: accessToken } = data.find(tu => tu.id === cf.testUserId);

  const user = await FB.api(`/${id}`, { fields: 'id, name, email' });

  return {
    facebookId: user.id,
    name: user.name,
    email: user.email,
    accessToken,
  };
}

describe('The auth mutation', async () => {
  describe('when signing up an user', async () => {
    it('should create a new user and return a token', async () => {
      const name = 'Peter';
      const email = 'peter@example.com';

      const query = {
        query: `
        mutation {
          auth {
            signup(name: "${name}", email: "${email}", password: "password")
          }
        }
      `,
      };

      const res = await postQuery(query);

      const token = res.body.data.auth.signup;
      const user = await userRepository.findByEmail(email);

      expect(user).not.toBeNull();
      expect(user.name).toEqual(name);
      expect(user.email).toEqual(email);

      expect(token).toBeValidJsonWebTokenWith({
        user: { name },
      });
    });

    it('should return an error if the user already exists', async () => {
      const user = {
        name: 'Peter',
        email: 'peter@example.com',
        password: '132146',
      };

      await userRepository.create(user);

      const query = {
        query: `
        mutation {
          auth {
            signup(name: "${user.name}", email: "${user.email}", password: "${user.password}")
          }
        }
      `,
      };

      const res = await postQuery(query);
      const error = res.body.errors[0];

      expect(error).not.toBeUndefined();
      expect(error).not.toBeNull();
      expect(error.code).toEqual(err.USER_ALREADY_REGISTERED.code);
    });
  });

  describe('when siging in an user', async () => {
    it('should return a valid token it the user exists', async () => {
      const user = {
        name: 'Peter',
        email: 'peter@example.com',
        password: '464987431',
      };

      const query = {
        query: `
        mutation {
          auth {
            signin(email: "${user.email}", password: "${user.password}")
          }
        }
      `,
      };

      await userRepository.create(user);

      const res = await postQuery(query);
      const token = res.body.data.auth.signin;

      expect(token).toBeValidJsonWebTokenWith({
        user: { id: user.id, name: user.name },
      });
    });

    it('should return an error if the email or password are invalid', async () => {
      const user = {
        name: 'Peter',
        email: 'peter@example.com',
        password: '464987431',
      };

      const query = {
        query: `
        mutation {
          auth {
            signin(email: "${user.email}", password: "any-invalid-pwd")
          }
        }
      `,
      };

      await userRepository.create(user);

      const res = await postQuery(query);
      const error = res.body.errors[0];

      expect(error).not.toBeUndefined();
      expect(error).not.toBeNull();
      expect(error.code).toEqual(err.INVALID_USER_OR_PWD.code);
    });
  });

  describe('when signing in an user with Facebook', async () => {
    it('should create a new user and return a token', async () => {
      const testUser = await getFacebookTestUser();

      const query = {
        query: `
        mutation {
          auth {
            signinWithFacebook(accessToken: "${testUser.accessToken}")
          }
        }
      `,
      };

      const res = await postQuery(query);

      const token = res.body.data.auth.signinWithFacebook;
      const user = await userRepository.findByEmail(testUser.email);

      expect(user).not.toBeNull();
      expect(user.name).toEqual(testUser.name);
      expect(user.email).toEqual(testUser.email);

      expect(token).toBeValidJsonWebTokenWith({
        user: { id: user.id, name: user.name },
      });
    });

    it('should return an error if the access token is invalid', async () => {
      const invalidAccessToken = 'any-invalid-token';

      const query = {
        query: `
        mutation {
          auth {
            signinWithFacebook(accessToken: "${invalidAccessToken}")
          }
        }
      `,
      };

      const res = await postQuery(query);
      const error = res.body.errors[0];

      expect(error).not.toBeUndefined();
      expect(error).not.toBeNull();
      expect(error.code).toEqual(err.INVALID_ACCESS_TOKEN.code);
    });
  });

  describe('when signing in an user with Google', async () => {
    // I couldn't find a good way to do integration tests with Google Auth.
    // The problem is that Google, unlike Facebook, doesn't provide test users
    // or any mechanism that allows us to get an access token for test purpose.
    // The only way to get an access token is to get a real user interacting
    // with their UI, which means that we'd need to create a brittle end-to-end test.
  });
});
