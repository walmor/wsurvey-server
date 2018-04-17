import authController from '../controllers/auth-controller';
import formsController from '../controllers/forms-controller';

const rootResolver = {
  Query: {
    auth: () => authController,
    forms: () => formsController,
  },

  Mutation: {
    auth: () => authController,
    forms: () => formsController,
  },
};

export default rootResolver;
