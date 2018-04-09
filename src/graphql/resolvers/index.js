import { merge } from 'lodash';
import rootResolver from './root-resolver';

const resolvers = merge(rootResolver);

export default resolvers;
