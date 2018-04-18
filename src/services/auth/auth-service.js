import jwt from 'jsonwebtoken';
import { isEmail } from 'validator';
import * as err from './../errors/error-constants';
import config from '../../config';

function createAuthToken(user) {
  return jwt.sign(
    {
      user: {
        id: user.id,
        name: user.name,
      },
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  );
}

async function signinWithSocialNetwork(accessToken, opts) {
  const { userRepository } = opts;
  const { tokenValidator } = opts;
  const { findBySocialNetworkId } = opts;
  const { socialNetworkIdProp } = opts;

  const tokenInfo = await tokenValidator.validateToken(accessToken);

  let user = await findBySocialNetworkId(tokenInfo.id);

  if (user) {
    return createAuthToken(user);
  }

  user = await userRepository.findByEmail(tokenInfo.email);

  if (user) {
    user[socialNetworkIdProp] = tokenInfo.id;
    user = await userRepository.update(user);

    return createAuthToken(user);
  }

  user = {
    name: tokenInfo.name,
    email: tokenInfo.email,
    [socialNetworkIdProp]: tokenInfo.id,
  };

  user = await userRepository.create(user);

  return createAuthToken(user);
}

export default function authService({ userRepository }, tokenValidators) {
  return {
    async signup(name, email, password) {
      const foundUser = await userRepository.findByEmail(email);

      if (foundUser) {
        throw err.USER_ALREADY_REGISTERED;
      }

      const user = await userRepository.create({ name, email, password });

      return createAuthToken(user);
    },

    async signin(email, password) {
      const user = await userRepository.findByEmailAndPassword(email, password);

      if (!user) {
        throw err.INVALID_USER_OR_PWD;
      }

      return createAuthToken(user);
    },

    async signinWithFacebook(accessToken) {
      const { facebookTokenValidator } = tokenValidators;
      return signinWithSocialNetwork(accessToken, {
        userRepository,
        tokenValidator: facebookTokenValidator,
        findBySocialNetworkId: id => userRepository.findByFacebookId(id),
        socialNetworkIdProp: 'facebookId',
      });
    },

    async signinWithGoogle(accessToken) {
      const { googleTokenValidator } = tokenValidators;
      return signinWithSocialNetwork(accessToken, {
        userRepository,
        tokenValidator: googleTokenValidator,
        findBySocialNetworkId: id => userRepository.findByGoogleId(id),
        socialNetworkIdProp: 'googleId',
      });
    },

    async findUserById(id) {
      return userRepository.findById(id);
    },

    async isEmailAvailable(email) {
      if (!isEmail(email)) {
        throw err.INVALID_EMAIL_ADDRESS;
      }

      return userRepository.isEmailAvailable(email);
    },
  };
}
