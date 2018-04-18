import { ce } from './custom-error';
import { ae } from './authorization-error';

export const USER_ALREADY_REGISTERED = ce(101, 'There is already an user registered with this email.');
export const INVALID_USER_OR_PWD = ce(102, 'Invalid email or password.');
export const INVALID_ACCESS_TOKEN = ce(103, 'The access token is invalid or has expired.');
export const EMAIL_PERMISSION_NOT_GRANTED = ce(104, 'The email permissions was not granted.');
export const INVALID_AUTH_TOKEN = ce(105, 'The authorization token is invalid.');

export const USER_NOT_SIGNED_IN = ae(401, 'The user is not signed in.');
export const NOT_AUTHORIZED = ae(401, 'The access to this resource is not authorized.');

export const INVALID_OBJECT_ID = ce(501, 'The object id is invalid.');
export const INVALID_EMAIL_ADDRESS = ce(502, 'The email address is invalid.');
