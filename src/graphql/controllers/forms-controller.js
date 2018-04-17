const formsController = {
  async find({ input }, { services, user }) {
    const { formService } = services;
    const opts = { ...input, ...{ user } };
    return formService.find(opts);
  },
  async findById({ formId }, { services, user }) {
    const { formService } = services;
    return formService.findById(formId, user);
  },
  async create({ form }, { services, user }) {
    const { formService } = services;
    return formService.create(form, user);
  },
  async update({ form }, { services, user }) {
    const { formService } = services;
    return formService.update(form, user);
  },
  async delete({ formId }, { services, user }) {
    const { formService } = services;
    await formService.delete(formId, user);
    return { success: true, formId };
  },
};

export default formsController;
