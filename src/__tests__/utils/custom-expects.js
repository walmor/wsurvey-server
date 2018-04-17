import { isMatch } from 'lodash';
import { fail } from 'assert';
import jwt from 'jsonwebtoken';
import { Model, Types } from 'mongoose';
import config from '../../config';

export async function expectToNotReturnMongooseModels(objUnderTest, methodsOpts) {
  const { methodsToTest, methodsToIgnore = [] } = methodsOpts;

  const methods = Object.keys(objUnderTest).filter(key => typeof objUnderTest[key] === 'function');

  for (let i = 0; i < methods.length; i++) {
    const methodName = methods[i];
    const methodToTest = objUnderTest[methodName].bind(objUnderTest);
    const args = methodsToTest[methodName];

    if (args !== undefined) {
      const obj = await methodToTest(...args); // eslint-disable-line

      if (!obj) {
        fail(`expect the method '${methodName}' to return an object`);
      }

      const isInvalidObject = (objToCheck) => {
        if (objToCheck instanceof Array) {
          for (let j = 0; j < objToCheck.length; j++) {
            const errorMsg = isInvalidObject(objToCheck[j]);
            if (errorMsg) {
              return errorMsg;
            }
          }
        } else if (objToCheck instanceof Model) {
          let errorMsg = `expect the method '${methodName}' to not return a mongoose model.`;
          errorMsg += ' It should return a plain object instead.';
          return errorMsg;
        } else if (Object.keys(objToCheck).some(key => objToCheck[key] instanceof Types.ObjectId)) {
          let errorMsg = `expect the method '${methodName}' to not return an object`;
          errorMsg += ' having properties of type ObjectId.';
          return errorMsg;
        }

        return null;
      };

      const errorMsg = isInvalidObject(obj);

      if (errorMsg) {
        fail(errorMsg);
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

export { expectToNotReturnMongooseModels as default };
