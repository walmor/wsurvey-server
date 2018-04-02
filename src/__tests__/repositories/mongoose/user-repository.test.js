import * as mongodbInMemory from '../../utils/mongodb-in-memory';
import { getRandomUser, saveUser } from '../../utils/user-factory';
import { expectToNotReturnMongooseModels } from '../../utils/custom-expects';
import userRepository from '../../../repositories/mongoose/user-repository';

beforeAll(async () => {
  await mongodbInMemory.init();
});

afterAll(async () => {
  await mongodbInMemory.stop();
});

beforeEach(async () => {
  await mongodbInMemory.clearDatabase();
});

describe('The user repository', async () => {
  describe('when creating a new user', async () => {
    it('should not save an user without a name', async () => {
      expect.assertions(2);

      const user = getRandomUser({ name: null });

      try {
        await userRepository.create(user);
      } catch (error) {
        expect(error.errors.name).toBeDefined();
        expect(error.errors.name.kind).toBe('required');
      }
    });

    it('should not save an user without an email', async () => {
      expect.assertions(2);

      const user = getRandomUser({ email: null });

      try {
        await userRepository.create(user);
      } catch (error) {
        expect(error.errors.email).toBeDefined();
        expect(error.errors.email.kind).toBe('required');
      }
    });

    it('should not save an user with an invalid email', async () => {
      expect.assertions(2);

      const user = getRandomUser({ email: 'not a valid email address' });

      try {
        await userRepository.create(user);
      } catch (error) {
        expect(error.errors.email).toBeDefined();
        expect(error.errors.email.message).toBe('Invalid email.');
      }
    });

    it('should not save an user if the email already exists', async () => {
      expect.assertions(2);

      const email = 'john@example.com';
      const user1 = getRandomUser({ email });
      const user2 = getRandomUser({ email });

      await userRepository.create(user1);

      try {
        await userRepository.create(user2);
      } catch (error) {
        const duplicateKeyErrorCode = 11000;
        expect(error.code).toBe(duplicateKeyErrorCode);
        expect(error.message).toContain(email);
      }
    });

    it('should save the users email in lowercase', async () => {
      const email = 'JOHN@EXAMPLE.COM';
      const user = getRandomUser({ email });

      await userRepository.create(user);

      expect(user.email).toEqual(email.toLowerCase());
    });

    it('should encrypt the user password', async () => {
      const password = 'p4$$wOrd';
      const user = getRandomUser({ password });

      await userRepository.create(user);

      expect(user.password).not.toBeFalsy();
      expect(user.password).not.toEqual(password);
      expect(user.password.length).toBeGreaterThan(password.length);
    });

    it.only('should save a valid user and return its id', async () => {
      const user = getRandomUser();

      const savedUser = await userRepository.create(user);

      expect(user.id).not.toBeFalsy();
      expect(savedUser.id).not.toBeFalsy();
    });
  });

  describe('when updating an user', async () => {
    it('should encrypt the password when it was altered', async () => {
      const user = getRandomUser();
      await userRepository.create(user);

      const oldEncryptedPassword = user.password;
      const newPassword = 'myNewHardPassword';

      user.password = newPassword;

      await userRepository.update(user);

      expect(user.password).not.toBeFalsy();
      expect(user.password).not.toEqual(newPassword);
      expect(user.password).not.toEqual(oldEncryptedPassword);
    });

    it('should not reencrypt the password when it was not altered', async () => {
      const user = getRandomUser();
      await userRepository.create(user);

      const encryptedPassword = user.password;
      user.name = 'Peter';

      await userRepository.update(user);

      expect(user.password).toEqual(encryptedPassword);
    });
  });

  describe('when searching by email', async () => {
    it('should find an existing user', async () => {
      const validEmail = 'john@example.com';

      const user = await saveUser({ email: validEmail });

      const foundUser = await userRepository.findByEmail(validEmail);

      expect(foundUser._id).toEqual(user._id);
    });

    it('should return null when there is no matches', async () => {
      await saveUser({ email: 'john@example.com' });

      const unexistentEmail = 'jeorge@example.com';

      const foundUser = await userRepository.findByEmail(unexistentEmail);

      expect(foundUser).toBeNull();
    });
  });

  describe('when searching by email and password', async () => {
    it('should find an existent user', async () => {
      const validEmail = 'john@example.com';
      const validPwd = 'password';

      const user = await saveUser({ email: validEmail, password: validPwd });

      const foundUser = await userRepository.findByEmailAndPassword(validEmail, validPwd);

      expect(foundUser._id).toEqual(user._id);
    });

    it('should return null when there is no email matches', async () => {
      await saveUser({ email: 'john@example.com' });

      const nonexistentEmail = 'jeorge@example.com';
      const anyPwd = 'password';

      const foundUser = await userRepository.findByEmailAndPassword(nonexistentEmail, anyPwd);

      expect(foundUser).toBeNull();
    });

    it('should return null when the password doesnt match', async () => {
      const validEmail = 'john@example.com';

      await saveUser({ email: validEmail, password: 'pwd' });

      const invalidPwd = 'invalidPassword';

      const foundUser = await userRepository.findByEmailAndPassword(validEmail, invalidPwd);

      expect(foundUser).toBeNull();
    });
  });

  describe('when searching by Facebook Id', async () => {
    it('should find an existent user', async () => {
      const validFacebookId = '4746164684961931';

      const user = await saveUser({ facebookId: validFacebookId });

      const foundUser = await userRepository.findByFacebookId(validFacebookId);

      expect(foundUser._id).toEqual(user._id);
    });

    it('should return null when there is no matches', async () => {
      await saveUser({ facebookId: '4746164684961931' });

      const unexistentFacebookId = '8464936496649494';

      const foundUser = await userRepository.findByFacebookId(unexistentFacebookId);

      expect(foundUser).toBeNull();
    });
  });

  describe('when searching by Google Id', async () => {
    it('should find an existent user', async () => {
      const validGoogleId = '9954946464949';

      const user = await saveUser({ googleId: validGoogleId });

      const foundUser = await userRepository.findByGoogleId(validGoogleId);

      expect(foundUser._id).toEqual(user._id);
    });

    it('should return null when there is no matches', async () => {
      await saveUser({ googleId: '9954946464949' });

      const unexistentGoogleId = '16549854949454';

      const foundUser = await userRepository.findByGoogleId(unexistentGoogleId);

      expect(foundUser).toBeNull();
    });
  });

  describe('when returning objects', async () => {
    it('should not return mongoose models', async () => {
      const password = 'password';

      const user = await saveUser({
        password,
      });

      const userToCreate = { name: 'Peter', email: 'peter@example.com', password: '123456' };
      const userToUpdate = { ...user, ...{ name: 'Peter Foo' } };

      const methods = {
        methodsToTest: {
          create: [userToCreate],
          update: [userToUpdate],
          findByEmail: [user.email],
          findByGoogleId: [user.googleId],
          findByFacebookId: [user.facebookId],
          findByEmailAndPassword: [user.email, password],
        },
      };

      await expectToNotReturnMongooseModels(userRepository, methods);
    });
  });
});
