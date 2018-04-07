import FB from 'fb';
import config from '../../config';
import CustomError from '../errors/custom-error';
import * as err from '../errors/error-constants';

const facebookTokenValidator = {
  async validateToken(accessToken) {
    try {
      FB.options({
        version: config.facebook.apiVersion,
        accessToken: config.facebook.appAccessToken(),
      });

      let response = await FB.api('/debug_token', {
        input_token: accessToken,
      });

      if (!response || !response.data) {
        throw err.INVALID_ACCESS_TOKEN;
      }

      if (response.data.error || !response.data.is_valid) {
        throw err.INVALID_ACCESS_TOKEN;
      }

      if (!response.data.scopes.includes('email')) {
        throw err.EMAIL_PERMISSION_NOT_GRANTED;
      }

      response = await FB.api(response.data.user_id, {
        fields: 'id, name, email',
      });

      if (!response || response.error) {
        throw err.INVALID_ACCESS_TOKEN;
      }

      return {
        id: response.id,
        name: response.name,
        email: response.email,
      };
    } catch (e) {
      if (e instanceof CustomError) {
        throw e;
      }

      throw err.INVALID_ACCESS_TOKEN;
    }
  },
};

export default facebookTokenValidator;
