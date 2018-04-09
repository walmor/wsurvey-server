import repos from '../repositories/mongoose';
import tokenValidators from './auth/token-validators';
import authService from './auth/auth-service';

const services = {
  authService: authService(repos, tokenValidators),
};

export default services;
