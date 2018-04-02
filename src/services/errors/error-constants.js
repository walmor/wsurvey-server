import { ce } from './custom-error';

export const USER_ALREADY_REGISTERED = ce(101, 'There is already an user registered with this email.');
export const INVALID_USER_OR_PWD = ce(102, 'Invalid email or password.');
export const INVALID_ACCESS_TOKEN = ce(103, 'The access token is invalid or has expired.');