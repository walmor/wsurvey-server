import FB from 'fb';
import config from '../../config';
import * as err from '../../services/errors/error-constants';
import accessTokenValidator from '../../services/auth/access-token-validator';

async function getFacebookTestUser({ grantedEmailPermission }) {
  const cf = config.facebook;
  const appAccessToken = cf.appAccessToken();

  FB.options({
    version: cf.apiVersion,
    accessToken: appAccessToken,
  });

  const testUsers = await FB.api(`${cf.appId}/accounts/test-users`);

  const testUserId = grantedEmailPermission ? cf.testUserId : cf.testUserIdNoEmailPerm;

  const accessToken = testUsers.data.find(tu => tu.id === testUserId).access_token;

  const result = await FB.api(testUserId, {
    fields: 'id, name, email',
  });

  return {
    id: result.id,
    name: result.name,
    email: result.email,
    accessToken,
  };
}

describe('The access token validator', async () => {
  describe('when validating Facebook access tokens', async () => {
    const validator = accessTokenValidator('Facebook');

    it('should return the user data when the token is valid', async () => {
      const testUser = await getFacebookTestUser({ grantedEmailPermission: true });

      const result = await validator.validateToken(testUser.accessToken);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result.id).toEqual(testUser.id);
      expect(result.name).toEqual(testUser.name);
      expect(result.email).toEqual(testUser.email);
    });

    it('should throw an error when the access token has expired', async () => {
      const expiredToken =
        'EAAFd30lIROIBANtHtZBeqLshF8sUXP64LFeXpCPLqjpG9CTAisFpLcENovRsaDmbFBwjPD53JNAPSZAkKzEze65t08J09FvmenexijIM4To1uDVGZCJiSKi4t8mBQyBRLZAhQMlYlkUZBZBtQyETxWmMMjtSc9872wZACJG1WWicufZAyXVeGx6z2ZCeFy9ovFK1L8fZCsUtJeBtRRllcK7ta2A5gvomhTAoBNqb40jkHsmzcFWCHpcuu0';

      const resultPromise = validator.validateToken(expiredToken);

      return expect(resultPromise).rejects.toThrowError(err.INVALID_ACCESS_TOKEN);
    });

    it('should throw an error when the token is not valid', async () => {
      const invalidToken = 'jgapojgpagkjpagkjpaj';

      const resultPromise = validator.validateToken(invalidToken);

      return expect(resultPromise).rejects.toThrowError(err.INVALID_ACCESS_TOKEN);
    });

    it('should throw an error when the user does not grant the email permission', async () => {
      const testUser = await getFacebookTestUser({ grantedEmailPermission: false });

      const resultPromise = validator.validateToken(testUser.accessToken);

      return expect(resultPromise).rejects.toThrowError(err.EMAIL_PERMISSION_NOT_GRANTED);
    });
  });
});
