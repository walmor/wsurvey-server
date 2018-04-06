import nock from 'nock';
import config from '../../config';
import * as err from '../../services/errors/error-constants';
import accessTokenValidator from '../../services/auth/access-token-validator';

function mockFacebookEndpoint(endpoint, query, body) {
  nock('https://graph.facebook.com')
    .get(`/${config.facebook.apiVersion}/${endpoint}`)
    .query(Object.assign({}, query, { access_token: /.*/ }))
    .reply(200, body);
}

function mockFacebookDebugTokenEndpoint(accessToken, body) {
  mockFacebookEndpoint('debug_token', { input_token: accessToken }, body);
}

function mockFacebookUserEndpoint(testUser) {
  mockFacebookEndpoint(testUser.id, { fields: 'id, name, email' }, testUser);
}

function mockGoogleTokenInfoEndpoint(idToken, body) {
  const responseCode = body.error_description ? 400 : 200;
  nock('https://www.googleapis.com')
    .defaultReplyHeaders({ 'access-control-allow-origin': '*' })
    .get('/oauth2/v3/tokeninfo')
    .query({ id_token: idToken })
    .reply(responseCode, body);
}

describe('The access token validator', async () => {
  describe('when validating Facebook access tokens', async () => {
    const validator = accessTokenValidator('Facebook');

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

      mockFacebookDebugTokenEndpoint(validAccessToken, replyBody);
      mockFacebookUserEndpoint(testUser);

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

      mockFacebookDebugTokenEndpoint(expiredToken, replyBody);

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

      mockFacebookDebugTokenEndpoint(invalidToken, replyBody);

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

      mockFacebookDebugTokenEndpoint(accessToken, replyBody);

      const resultPromise = validator.validateToken(accessToken);

      return expect(resultPromise).rejects.toThrowError(err.EMAIL_PERMISSION_NOT_GRANTED);
    });
  });

  fdescribe('when validating Google access tokens', async () => {
    const validator = accessTokenValidator('Google');

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

      mockGoogleTokenInfoEndpoint(validIdToken, replyBody);

      const result = await validator.validateToken(validIdToken);

      expect(result).toEqual(testUser);
    });

    it('should throw an error when the access token is invalid or expired', async () => {
      const expiredIdToken = 'EAAFd30lIROIBANtHtZBeqLshF8sUXP64LFeXpCPLqjpG9CTAisFpLcE';

      const replyBody = {
        error_description: 'Invalid value',
      };

      mockGoogleTokenInfoEndpoint(expiredIdToken, replyBody);

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

      mockGoogleTokenInfoEndpoint(validIdTokenForAnotherApp, replyBody);

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

      mockGoogleTokenInfoEndpoint(validIdToken, replyBody);

      const resultPromise = validator.validateToken(validIdToken);

      return expect(resultPromise).rejects.toThrowError(err.EMAIL_PERMISSION_NOT_GRANTED);
    });
  });
});
