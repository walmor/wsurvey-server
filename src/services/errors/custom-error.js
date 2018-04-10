function CustomError(code, message) {
  this.code = code;
  this.message = message;
}

CustomError.prototype = Object.create(Error.prototype);
CustomError.prototype.name = 'CustomError';

function ce(code, message) {
  return new CustomError(code, message);
}

export { CustomError as default, ce };
