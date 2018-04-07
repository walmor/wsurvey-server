import authService from '../../../services/auth/auth-service';
import * as err from '../../../services/errors/error-constants';
import '../../utils/custom-expects';

function getRandomUser() {
  return {
    id: '4fa64f64f4a6f',
    name: 'Peter',
    email: 'peter@example.com',
    password: '123456',
  };
}

function getAuthService(userRepository, tokenValidators) {
  return authService(
    {
      userRepository,
    },
    tokenValidators,
  );
}

function expectedJwtPayload(user) {
  return { user: { id: user.id, name: user.name } };
}

function getTokenValidatorsStub(name, user, id) {
  return {
    [name]: {
      async validateToken() {
        return {
          id,
          name: user.name,
          email: user.email,
        };
      },
    },
  };
}

function getFacebookTokenValidatorStub(user, id) {
  return getTokenValidatorsStub('facebookTokenValidator', user, id);
}

function getGoogleTokenValidatorStub(user, id) {
  return getTokenValidatorsStub('googleTokenValidator', user, id);
}

describe('The authService', async () => {
  describe('when signing up an user', async () => {
    it('should create the user and return a jwt', async () => {
      const user = getRandomUser();

      const userRepoStub = {
        findByEmail() {
          return null;
        },
        create() {
          return user;
        },
      };

      const service = getAuthService(userRepoStub);

      const token = await service.signup(user.name, user.email, user.password);

      expect(token).toBeValidJsonWebTokenWith(expectedJwtPayload(user));
    });

    it('should throw an error when the user already exist', async () => {
      const user = getRandomUser();

      const userRepoStub = {
        findByEmail() {
          return user;
        },
      };

      const service = getAuthService(userRepoStub);

      const signupPromise = service.signup(user.name, user.email, user.password);

      await expect(signupPromise).rejects.toThrowError(err.USER_ALREADY_REGISTERED);
    });
  });

  describe('when signing in an user', async () => {
    describe('via email and password', async () => {
      it('should return a jwt if the email and password are valid', async () => {
        const user = getRandomUser();

        const userRepoStub = {
          findByEmailAndPassword() {
            return user;
          },
        };

        const service = getAuthService(userRepoStub);

        const token = await service.signin(user.email, user.password);

        expect(token).toBeValidJsonWebTokenWith(expectedJwtPayload(user));
      });

      it('should throw an error if the email and/or password are invalid', async () => {
        const user = getRandomUser();

        const userRepoStub = {
          findByEmailAndPassword() {
            return null;
          },
        };

        const service = getAuthService(userRepoStub);

        const signupPromise = service.signin(user.email, user.password);

        await expect(signupPromise).rejects.toThrowError(err.INVALID_USER_OR_PWD);
      });
    });

    describe('via Facebook access token', async () => {
      const anyValidAccessToken = 'yuy4dh64d6h4dh9d4h64d9';
      const anyValidFacebookId = '64646194964';

      it('should throw an error if the token is invalid', async () => {
        const accessTokenValidators = {
          facebookTokenValidator: {
            async validateToken() {
              throw err.INVALID_ACCESS_TOKEN;
            },
          },
        };

        const service = getAuthService(null, accessTokenValidators);

        const signinPromise = service.signinWithFacebook('any-invalid-token');

        await expect(signinPromise).rejects.toThrowError(err.INVALID_ACCESS_TOKEN);
      });

      it('should create a new user if it does not exist', async () => {
        const user = getRandomUser();

        const tokenValidatorStub = getFacebookTokenValidatorStub(user, anyValidFacebookId);

        const userRepoStub = {
          findByEmail() {
            return null;
          },
          findByFacebookId() {
            return null;
          },
          create() {
            return user;
          },
        };

        const service = getAuthService(userRepoStub, tokenValidatorStub);

        const token = await service.signinWithFacebook(anyValidAccessToken);

        expect(token).toBeValidJsonWebTokenWith(expectedJwtPayload(user));
      });

      it('should merge accounts if an user with the returned email already exists', async () => {
        const user = getRandomUser();
        let updatedUser = null;

        const tokenValidatorStub = getFacebookTokenValidatorStub(user, anyValidFacebookId);

        const userRepoStub = {
          findByEmail() {
            return user;
          },
          findByFacebookId() {
            return null;
          },
          update(usr) {
            updatedUser = usr;
            return updatedUser;
          },
        };

        const service = getAuthService(userRepoStub, tokenValidatorStub);

        const token = await service.signinWithFacebook(anyValidAccessToken);

        expect(token).toBeValidJsonWebTokenWith(expectedJwtPayload(user));
        expect(updatedUser.facebookId).toEqual(anyValidFacebookId);
      });

      it('should just sign the user in if it has already signed up with Facebook', async () => {
        const user = getRandomUser();

        const tokenValidatorStub = getFacebookTokenValidatorStub(user, anyValidFacebookId);

        const userRepoStub = {
          findByFacebookId() {
            return user;
          },
        };

        const service = getAuthService(userRepoStub, tokenValidatorStub);

        const token = await service.signinWithFacebook(anyValidAccessToken);

        expect(token).toBeValidJsonWebTokenWith(expectedJwtPayload(user));
      });
    });

    describe('via Google access token', async () => {
      const anyValidAccessToken = 'yuy4dh64d6h4dh9d4h64d9';
      const anyValidGoogleId = '131643164697';

      it('should throw an error if the token is invalid', async () => {
        const tokenValidators = {
          googleTokenValidator: {
            async validateToken() {
              throw err.INVALID_ACCESS_TOKEN;
            },
          },
        };

        const service = getAuthService(null, tokenValidators);

        const signinPromise = service.signinWithGoogle('any-invalid-token');

        await expect(signinPromise).rejects.toThrowError(err.INVALID_ACCESS_TOKEN);
      });

      it('should create a new user if it does not exist', async () => {
        const user = getRandomUser();

        const tokenValidatorStub = getGoogleTokenValidatorStub(user, anyValidGoogleId);

        const userRepoStub = {
          findByEmail() {
            return null;
          },
          findByGoogleId() {
            return null;
          },
          create() {
            return user;
          },
        };

        const service = getAuthService(userRepoStub, tokenValidatorStub);

        const token = await service.signinWithGoogle(anyValidAccessToken);

        expect(token).toBeValidJsonWebTokenWith(expectedJwtPayload(user));
      });

      it('should merge accounts if an user with the returned email already exists', async () => {
        const user = getRandomUser();
        let updatedUser = null;

        const tokenValidatorStub = getGoogleTokenValidatorStub(user, anyValidGoogleId);

        const userRepoStub = {
          findByEmail() {
            return user;
          },
          findByGoogleId() {
            return null;
          },
          update(usr) {
            updatedUser = usr;
            return updatedUser;
          },
        };

        const service = getAuthService(userRepoStub, tokenValidatorStub);

        const token = await service.signinWithGoogle(anyValidAccessToken);

        expect(token).toBeValidJsonWebTokenWith(expectedJwtPayload(user));
        expect(updatedUser.googleId).toEqual(anyValidGoogleId);
      });

      it('should just sign the user in if it has already signed up with Google', async () => {
        const user = getRandomUser();

        const tokenValidatorStub = getGoogleTokenValidatorStub(user, anyValidGoogleId);

        const userRepoStub = {
          findByGoogleId() {
            return user;
          },
        };

        const service = getAuthService(userRepoStub, tokenValidatorStub);

        const token = await service.signinWithGoogle(anyValidAccessToken);

        expect(token).toBeValidJsonWebTokenWith(expectedJwtPayload(user));
      });
    });
  });
});
