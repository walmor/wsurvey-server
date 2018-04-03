import jwt from 'jsonwebtoken';
import * as err from './errors/error-constants';
import config from '../config';

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

function socialNetworkService({ userRepository, accessTokenValidator }) {
  return {
    async signin(socialNetwork, accessToken) {
      const findBySocialNetworkId = `findBy${socialNetwork}Id`;
      const socialNetworkIdProp = `${socialNetwork.toLowerCase()}Id`;

      const tokenInfo = accessTokenValidator.validateToken(socialNetwork, accessToken);

      let user = await userRepository[findBySocialNetworkId](tokenInfo.id);

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
    },
  };
}

export default function authService({ userRepository, accessTokenValidator }) {
  const socialNetworkSvc = socialNetworkService({ userRepository, accessTokenValidator });

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
      return socialNetworkSvc.signin('Facebook', accessToken);
    },

    async signinWithGoogle(accessToken) {
      return socialNetworkSvc.signin('Google', accessToken);
    },
  };
}
