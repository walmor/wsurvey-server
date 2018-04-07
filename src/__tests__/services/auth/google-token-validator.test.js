import nock from 'nock';
import config from '../../../config';
import * as err from '../../../services/errors/error-constants';
import googleTokeValidator from '../../../services/auth/google-token-validator';

function mockTokenInfoEndpoint(idToken, body) {
  const responseCode = body.error_description ? 400 : 200;
  nock('https://www.googleapis.com')
    .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
    .get('/oauth2/v3/tokeninfo')
    .query({ id_token: idToken })
    .reply(responseCode, body);
}

describe('The Google token validator', async () => {
  const validator = googleTokeValidator;

  it('should return the user data when the token is valid', async () => {
    const validIdToken = 'fmapjgajg09ir0fkpfj30';

    const testUser = {
      id: '104955927023899',
      name: 'Test User',
      email: 'testuser@example.com',
    };

    const replyBody = {
      aud: config.google.clientId,
      sub: testUser.id,
      email: testUser.email,
      name: testUser.name,
    };

    mockTokenInfoEndpoint(validIdToken, replyBody);

    const result = await validator.validateToken(validIdToken);

    expect(result).toEqual(testUser);
  });

  it('should throw an error when the access token is invalid or expired', async () => {
    const expiredIdToken = 'EAAFd30lIROIBANtHtZBeqLshF8sUXP64LFeXpCPLqjpG9CTAisFpLcE';

    const replyBody = {
      error_description: 'Invalid value',
    };

    mockTokenInfoEndpoint(expiredIdToken, replyBody);

    const resultPromise = validator.validateToken(expiredIdToken);

    return expect(resultPromise).rejects.toThrowError(err.INVALID_ACCESS_TOKEN);
  });

  it('should throw an error when the token was issued for another app', async () => {
    const validIdTokenForAnotherApp = 'fmapjgajg09ir0fkpfj30';

    const testUser = {
      id: '104955927023899',
      name: 'Test User',
      email: 'testuser@example.com',
    };

    const replyBody = {
      aud: 'any-other-client-id',
      sub: testUser.id,
      email: testUser.email,
      name: testUser.name,
    };

    mockTokenInfoEndpoint(validIdTokenForAnotherApp, replyBody);

    const resultPromise = validator.validateToken(validIdTokenForAnotherApp);

    return expect(resultPromise).rejects.toThrowError(err.INVALID_ACCESS_TOKEN);
  });

  it('should throw an error when the user does not grant the email permission', async () => {
    const validIdToken = 'fmapjgajg09ir0fkpfj30';

    const testUser = {
      id: '104955927023899',
      name: 'Test User',
      email: 'testuser@example.com',
    };

    const replyBody = {
      aud: config.google.clientId,
      sub: testUser.id,
      // email: email is not present,
      name: testUser.name,
    };

    mockTokenInfoEndpoint(validIdToken, replyBody);

    const resultPromise = validator.validateToken(validIdToken);

    return expect(resultPromise).rejects.toThrowError(err.EMAIL_PERMISSION_NOT_GRANTED);
  });
});
