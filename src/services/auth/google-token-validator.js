import axios from 'axios';
import config from '../../config';
import CustomError from '../errors/custom-error';
import * as err from '../errors/error-constants';

const googleTokenValidator = {
  async validateToken(idToken) {
    try {
      if (!idToken) return false;

      const { data } = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${idToken}`);

      if (data.aud !== config.google.clientId) {
        throw err.INVALID_ACCESS_TOKEN;
      }

      if (!data.email) {
        throw err.EMAIL_PERMISSION_NOT_GRANTED;
      }

      return {
        id: data.sub,
        name: data.name,
        email: data.email,
      };
    } catch (e) {
      if (e instanceof CustomError) {
        throw e;
      }
      throw err.INVALID_ACCESS_TOKEN;
    }
  },
};

export default googleTokenValidator;
