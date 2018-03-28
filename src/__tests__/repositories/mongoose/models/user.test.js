import * as mongodbInMemory from '../../../utils/mongodb-in-memory';
import { saveUser } from '../../../utils/user-factory';

beforeAll(async () => {
  await mongodbInMemory.init();
});

afterAll(async () => {
  await mongodbInMemory.stop();
});

beforeEach(async () => {
  await mongodbInMemory.clearDatabase();
});

describe('The User instance', async () => {
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
