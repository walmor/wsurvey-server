import * as mongodbInMemory from './utils/mongodb-in-memory';
import User from '../models/user';

beforeAll(async () => {
  await mongodbInMemory.init();
});

afterAll(async () => {
  await mongodbInMemory.stop();
});

beforeEach(async () => {
  await mongodbInMemory.clearDatabase();
});

function getRandomUser(userProps) {
  return new User(Object.assign(
    {
      name: 'John',
      email: 'john@example.com',
      password: 'password',
      googleId: '16491654965494',
      facebookId: '5743164649619',
    },
    userProps,
  ));
}

async function saveUser(userProps) {
  const user = getRandomUser(userProps);
  return user.save();
}

describe('The User', async () => {
  describe('instance', async () => {
    it('should not be saved without a name', async () => {
      expect.assertions(2);

      const user = getRandomUser({ name: null });

      try {
        await user.save();
      } catch (error) {
        expect(error.errors.name).toBeDefined();
        expect(error.errors.name.kind).toBe('required');
      }
    });

    it('should not be saved without an email', async () => {
      expect.assertions(2);

      const user = getRandomUser({ email: null });

      try {
        await user.save();
      } catch (error) {
        expect(error.errors.email).toBeDefined();
        expect(error.errors.email.kind).toBe('required');
      }
    });

    it('should not be saved with an invalid email', async () => {
      expect.assertions(2);

      const user = getRandomUser({ email: 'not a valid email address' });

      try {
        await user.save();
      } catch (error) {
        expect(error.errors.email).toBeDefined();
        expect(error.errors.email.message).toBe('Invalid email.');
      }
    });

    it('should not be saved if the email already exists', async () => {
      expect.assertions(2);

      const email = 'john@example.com';
      const user1 = getRandomUser({ email });
      const user2 = getRandomUser({ email });

      await user1.save();

      try {
        await user2.save();
      } catch (error) {
        const duplicateKeyErrorCode = 11000;
        expect(error.code).toBe(duplicateKeyErrorCode);
        expect(error.message).toContain(email);
      }
    });

    it('should be saved with a lowercase email', async () => {
      const email = 'JOHN@EXAMPLE.COM';
      const user = getRandomUser({ email });

      await user.save();

      expect(user.email).toEqual(email.toLowerCase());
    });

    it('should be saved with an encrypted password', async () => {
      const password = 'p4$$wOrd';
      const user = getRandomUser({ password });

      await user.save();

      expect(user.password).not.toBeFalsy();
      expect(user.password).not.toEqual(password);
      expect(user.password.length).toBeGreaterThan(password.length);
    });

    it('should encrypt the password when it was altered', async () => {
      const user = getRandomUser();
      await user.save();

      const oldEncryptedPassword = user.password;
      const newPassword = 'myNewHardPassword';

      user.password = newPassword;

      await user.save();

      expect(user.password).not.toBeFalsy();
      expect(user.password).not.toEqual(newPassword);
      expect(user.password).not.toEqual(oldEncryptedPassword);
    });

    it('should not reencrypt the password when it was not altered', async () => {
      const user = getRandomUser();
      await user.save();

      const encryptedPassword = user.password;
      user.name = 'Peter';

      await user.save();

      expect(user.password).toEqual(encryptedPassword);
    });

    describe('when comparing a password', () => {
      it('should identify a valid password', async () => {
        const validPassword = 'p4$$w0rd';
        const user = await saveUser({ password: validPassword });

        const result = await user.comparePassword(validPassword);

        expect(result).toBe(true);
      });

      it('should identify an invalid password', async () => {
        const invalidPassword = 'anyInvalidPwd';

        const user = await saveUser({ password: 'p4$$w0rd' });

        const result = await user.comparePassword(invalidPassword);

        expect(result).toBe(false);
      });
    });
  });

  describe('model', async () => {
    describe('when searching by email', async () => {
      it('should find an existing user', async () => {
        const validEmail = 'john@example.com';

        const user = await saveUser({ email: validEmail });

        const foundUser = await User.findByEmail(validEmail);

        expect(foundUser._id).toEqual(user._id);
      });

      it('should return null when there is no matches', async () => {
        await saveUser({ email: 'john@example.com' });

        const unexistentEmail = 'jeorge@example.com';

        const foundUser = await User.findByEmail(unexistentEmail);

        expect(foundUser).toBeNull();
      });
    });

    describe('when searching by email and password', async () => {
      it('should find an existent user', async () => {
        const validEmail = 'john@example.com';
        const validPwd = 'password';

        const user = await saveUser({ email: validEmail, password: validPwd });

        const foundUser = await User.findByEmailAndPassword(validEmail, validPwd);

        expect(foundUser._id).toEqual(user._id);
      });

      it('should return null when there is no email matches', async () => {
        await saveUser({ email: 'john@example.com' });

        const nonexistentEmail = 'jeorge@example.com';
        const anyPwd = 'password';

        const foundUser = await User.findByEmailAndPassword(nonexistentEmail, anyPwd);

        expect(foundUser).toBeNull();
      });

      it('should return null when the password doesnt match', async () => {
        const validEmail = 'john@example.com';

        await saveUser({ email: validEmail, password: 'pwd' });

        const invalidPwd = 'invalidPassword';

        const foundUser = await User.findByEmailAndPassword(validEmail, invalidPwd);

        expect(foundUser).toBeNull();
      });
    });

    describe('when searching by Facebook Id', async () => {
      it('should find an existent user', async () => {
        const validFacebookId = '4746164684961931';

        const user = await saveUser({ facebookId: validFacebookId });

        const foundUser = await User.findByFacebookId(validFacebookId);

        expect(foundUser._id).toEqual(user._id);
      });

      it('should return null when there is no matches', async () => {
        await saveUser({ facebookId: '4746164684961931' });

        const unexistentFacebookId = '8464936496649494';

        const foundUser = await User.findByFacebookId(unexistentFacebookId);

        expect(foundUser).toBeNull();
      });
    });

    describe('when searching by Google Id', async () => {
      it('should find an existent user', async () => {
        const validGoogleId = '9954946464949';

        const user = await saveUser({ googleId: validGoogleId });

        const foundUser = await User.findByGoogleId(validGoogleId);

        expect(foundUser._id).toEqual(user._id);
      });

      it('should return null when there is no matches', async () => {
        await saveUser({ googleId: '9954946464949' });

        const unexistentGoogleId = '16549854949454';

        const foundUser = await User.findByGoogleId(unexistentGoogleId);

        expect(foundUser).toBeNull();
      });
    });
  });
});
