import { fail } from 'assert';
import { Model } from 'mongoose';

async function expectToNotReturnMongooseModels(objUnderTest, methodsOpts) {
  const { methodsToTest, methodsToIgnore = [] } = methodsOpts;
  // methodsToIgnore = methodsToIgnore || [];

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
        fail(`expect the method '${methodName}' to not return a mongoose model. It should return a plain object instead.`);
      }
    } else if (methodsToIgnore.indexOf(methodName) === -1) {
      fail(`expect the method '${methodName}' to be tested to verify if it's returning plain objects.`);
    }
  }
}

export default expectToNotReturnMongooseModels;
