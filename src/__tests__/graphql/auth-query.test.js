import supertest from 'supertest';
import app from '../../app';
import * as mongodbInMemory from '../utils/mongodb-in-memory';
import * as err from '../../services/errors/error-constants';
import services from '../../services/';
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

function getCurrentUserQuery() {
  return {
    query: `
        query {
          viewer {
            id,
            name,
            email
          }
        }
      `,
  };
}

function sendIsEmailAvailableQuery(email) {
  const query = {
    query: `
        query {
          isEmailAvailable(email: "${email}")
        }
      `,
  };

  return request
    .post('/graphql')
    .set('Accept', 'application/json')
    .send(query);
}

async function sendCurrentUserQuery(token) {
  const query = getCurrentUserQuery();
  const authToken = token ? `Bearer ${token}` : null;
  const post = request.post('/graphql').set('Accept', 'application/json');

  if (authToken) {
    post.set('Authorization', authToken);
  }

  return post.send(query);
}

describe('The auth query', async () => {
  it('should return null when there is no authorization token', async () => {
    const noToken = null;

    const res = await sendCurrentUserQuery(noToken);

    const userData = res.body.data.viewer;

    expect(userData).toBeNull();
  });

  it('should return an error when then authorization token is invalid', async () => {
    const invalidToken = 'any-invalid-token';

    const res = await sendCurrentUserQuery(invalidToken);

    expect(res.statusCode).toEqual(401);
    expect(res.body.error.code).toEqual(err.INVALID_AUTH_TOKEN.code);
  });

  it('should return the user data when the authorization token is valid', async () => {
    const user = {
      name: 'Peter',
      email: 'peter@example.com',
      password: '132146',
    };

    const { authService } = services;
    const token = await authService.signup(user.name, user.email, user.password);

    const res = await sendCurrentUserQuery(token);

    const { viewer } = res.body.data;

    expect(viewer.email).toEqual(user.email);
    expect(viewer.name).toEqual(user.name);
  });

  describe('when checking if an email is available', async () => {
    it('should return true if there is no user with the given email', async () => {
      const anyAvailableEmail = 'any@example.com';

      const res = await sendIsEmailAvailableQuery(anyAvailableEmail);

      const isAvailable = res.body.data.isEmailAvailable;

      expect(isAvailable).toBe(true);
    });

    it('should return false if an user with the given email exists', async () => {
      const user = {
        name: 'Peter',
        email: 'peter@example.com',
        password: '132146',
      };

      const { authService } = services;
      await authService.signup(user.name, user.email, user.password);

      const res = await sendIsEmailAvailableQuery(user.email);

      const isAvailable = res.body.data.isEmailAvailable;

      expect(isAvailable).toBe(false);
    });

    it('should return an error when the given email is invalid', async () => {
      const anyInvalidEmail = 'any-invalid-email';

      const res = await sendIsEmailAvailableQuery(anyInvalidEmail);

      const { errors } = res.body;

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toEqual(err.INVALID_EMAIL_ADDRESS.code);
    });
  });
});
