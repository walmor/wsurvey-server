import { merge } from 'lodash';
import { authQueryResolver, authMutationResolver } from './auth-resolvers';
import { formQueryResolver, formMutationResolver } from './form-resolvers';

const Query = merge(authQueryResolver, formQueryResolver);
const Mutation = merge(authMutationResolver, formMutationResolver);

const rootResolver = {
  Query,
  Mutation,
};

export default rootResolver;
