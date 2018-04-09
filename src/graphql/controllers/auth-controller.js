const authController = {
  async signup({ name, email, password }, { services }) {
    const { authService } = services;
    return authService.signup(name, email, password);
  },

  async signin({ email, password }, { services }) {
    const { authService } = services;
    return authService.signin(email, password);
  },

  async signinWithFacebook({ accessToken }, { services }) {
    const { authService } = services;
    return authService.signinWithFacebook(accessToken);
  },

  async signinWithGoogle({ idToken }, { services }) {
    const { authService } = services;
    return authService.signinWithGoogle(idToken);
  },

  currentUser(parent, args, context) {
    return context.user || null;
  },
};

export default authController;
