class CustomError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function ce(code, message) {
  return new CustomError(message, code);
}

export { CustomError as default, ce };
