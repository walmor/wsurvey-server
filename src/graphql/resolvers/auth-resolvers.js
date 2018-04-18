const authQueryResolver = {
  viewer(_, __, context) {
    return context.user || null;
  },
  async isEmailAvailable(_, { email }, { services }) {
    const { authService } = services;
    return authService.isEmailAvailable(email);
  },
};

const authMutationResolver = {
  async signup(_, { name, email, password }, { services }) {
    const { authService } = services;
    return authService.signup(name, email, password);
  },

  async signin(_, { email, password }, { services }) {
    const { authService } = services;
    return authService.signin(email, password);
  },

  async signinWithFacebook(_, { accessToken }, { services }) {
    const { authService } = services;
    return authService.signinWithFacebook(accessToken);
  },

  async signinWithGoogle(_, { idToken }, { services }) {
    const { authService } = services;
    return authService.signinWithGoogle(idToken);
  },
};

export { authQueryResolver, authMutationResolver };
