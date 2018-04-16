function AuthorizationError(code, message) {
  this.code = code;
  this.message = message;
}

AuthorizationError.prototype = Object.create(Error.prototype);
AuthorizationError.prototype.name = 'AuthorizationError';

function ae(code, message) {
  return new AuthorizationError(code, message);
}

export { AuthorizationError as default, ae };
