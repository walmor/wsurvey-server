import { isMatch } from 'lodash';
import { fail } from 'assert';
import jwt from 'jsonwebtoken';
import { Model } from 'mongoose';
import config from '../../config';

async function expectToNotReturnMongooseModels(objUnderTest, methodsOpts) {
  const { methodsToTest, methodsToIgnore = [] } = methodsOpts;

  const methods = Object.keys(objUnderTest).filter(key => typeof objUnderTest[key] === 'function');

  for (let i = 0; i < methods.length; i++) {
    const methodName = methods[i];
    const methodToTest = objUnderTest[methodName].bind(objUnderTest);
    const args = methodsToTest[methodName];

    if (args !== undefined) {
      const user = await methodToTest(...args); // eslint-disable-line

      if (!user) {
        fail(`expect the method '${methodName}' to return an object`);
      }

      if (user instanceof Model) {
        let msg = `expect the method '${methodName}' to not return a mongoose model.`;
        msg += ' It should return a plain object instead.';
        fail(msg);
      }
    } else if (methodsToIgnore.indexOf(methodName) === -1) {
      fail(`expect the method '${methodName}' to be tested to verify if it's returning plain objects.`);
    }
  }
}

expect.extend({
  toBeValidJsonWebTokenWith(token, expectedPayload) {
    const payload = jwt.verify(token, config.jwt.secret);

    if (isMatch(payload, expectedPayload)) {
      return {
        message: () => 'expected the token not to be a valid json web token containing the passed payload',
        pass: true,
      };
    }

    return {
      message: () => 'expected the token to be a valid json web token containing the given payload',
      pass: false,
    };
  },
});

export default { expectToNotReturnMongooseModels };
