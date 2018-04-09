import authController from '../controllers/auth-controller';

const rootResolver = {
  Query: {
    auth: () => authController,
  },

  Mutation: {
    auth: () => authController,
  },
};

export default rootResolver;
