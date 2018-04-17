import repos from '../repositories/mongoose';
import tokenValidators from './auth/token-validators';
import authService from './auth/auth-service';
import formService from './form/form-service';
import '../repositories/mongoose/models/question-kinds';

const services = {
  authService: authService(repos, tokenValidators),
  formService: formService(repos),
};

export default services;
