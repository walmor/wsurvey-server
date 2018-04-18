const formQueryResolver = {
  async form(_, { formId }, { services, user }) {
    const { formService } = services;
    return formService.findById(formId, user);
  },
  async forms(_, { input }, { services, user }) {
    const { formService } = services;
    const opts = { ...input, ...{ user } };
    return formService.find(opts);
  },
};

const formMutationResolver = {
  async createForm(_, { form }, { services, user }) {
    const { formService } = services;
    return formService.create(form, user);
  },
  async updateForm(_, { form }, { services, user }) {
    const { formService } = services;
    return formService.update(form, user);
  },
  async deleteForm(_, { formId }, { services, user }) {
    const { formService } = services;
    await formService.delete(formId, user);
    return { success: true, formId };
  },
};

export { formQueryResolver, formMutationResolver };
