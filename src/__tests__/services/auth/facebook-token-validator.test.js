import nock from 'nock';
import config from '../../../config';
import * as err from '../../../services/errors/error-constants';
import facebookTokeValidator from '../../../services/auth/facebook-token-validator';

function mockEndpoint(endpoint, query, body) {
  nock('https://graph.facebook.com', { allowUnmocked: true })
    .get(`/${config.facebook.apiVersion}/${endpoint}`)
    .query(Object.assign({}, query, { access_token: /.*/ }))
    .reply(200, body);
}

function mockDebugTokenEndpoint(accessToken, body) {
  mockEndpoint('debug_token', { input_token: accessToken }, body);
}

function mockUserEndpoint(testUser) {
  mockEndpoint(testUser.id, { fields: 'id, name, email' }, testUser);
}

describe('The Facebook token validator', async () => {
  const validator = facebookTokeValidator;

  it('should return the user data when the token is valid', async () => {
    const validAccessToken = 'fmapjgajg09ir0fkpfj30';

    const testUser = {
      id: '104955927023899',
      name: 'Test User',
      email: 'testuser@example.com',
    };

    const replyBody = {
      data: {
        is_valid: true,
        scopes: ['email', 'public_profile'],
        user_id: testUser.id,
      },
    };

    mockDebugTokenEndpoint(validAccessToken, replyBody);
    mockUserEndpoint(testUser);

    const result = await validator.validateToken(validAccessToken);

    expect(result).toEqual(testUser);
  });

  it('should throw an error when the access token has expired', async () => {
    const expiredToken = 'EAAFd30lIROIBANtHtZBeqLshF8sUXP64LFeXpCPLqjpG9CTAisFpLcE';

    const replyBody = {
      data: {
        error: {
          code: 190,
          message: 'Any error message',
          subcode: 464,
        },
        expires_at: 1522724400,
        is_valid: false,
      },
    };

    mockDebugTokenEndpoint(expiredToken, replyBody);

    const resultPromise = validator.validateToken(expiredToken);

    return expect(resultPromise).rejects.toThrowError(err.INVALID_ACCESS_TOKEN);
  });

  it('should throw an error when the token is not valid', async () => {
    const invalidToken = 'jgapojgpagkjpagkjpaj';

    const replyBody = {
      data: {
        error: { code: 190, message: 'Invalid OAuth access token.' },
        is_valid: false,
      },
    };

    mockDebugTokenEndpoint(invalidToken, replyBody);

    const resultPromise = validator.validateToken(invalidToken);

    return expect(resultPromise).rejects.toThrowError(err.INVALID_ACCESS_TOKEN);
  });

  it('should throw an error when the user does not grant the email permission', async () => {
    const accessToken = 'EAAFd30lIROIBANtHtZBeqLshF8sUXP64LFeXpCPLqjpG9CTAisFpLcE';

    const replyBody = {
      data: {
        is_valid: true,
        scopes: ['public_profile'],
        user_id: '4646464646',
      },
    };

    mockDebugTokenEndpoint(accessToken, replyBody);

    const resultPromise = validator.validateToken(accessToken);

    return expect(resultPromise).rejects.toThrowError(err.EMAIL_PERMISSION_NOT_GRANTED);
  });
});
