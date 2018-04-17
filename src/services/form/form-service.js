import * as err from '../errors/error-constants';

function ensureUserSignedIn(user) {
  if (!user || !user.id) {
    throw err.USER_NOT_SIGNED_IN;
  }
}

export default function formService({ formRepository }) {
  return {
    async create(form, user) {
      ensureUserSignedIn(user);

      form.userId = user.id;

      return formRepository.create(form);
    },

    async update(form, user) {
      ensureUserSignedIn(user);

      if (!form.id) {
        throw err.INVALID_OBJECT_ID;
      }

      const currentForm = await formRepository.findById(form.id);

      if (currentForm.userId !== user.id) {
        throw err.NOT_AUTHORIZED;
      }

      return formRepository.update(form);
    },

    async delete(formId, user) {
      ensureUserSignedIn(user);

      if (!formId) {
        throw err.INVALID_OBJECT_ID;
      }

      const form = await formRepository.findById(formId);

      if (form.userId !== user.id) {
        throw err.NOT_AUTHORIZED;
      }

      return formRepository.delete(formId);
    },

    async findById(formId, user) {
      ensureUserSignedIn(user);

      const form = await formRepository.findById(formId);

      if (!form) return null;

      if (form.userId !== user.id) {
        throw err.NOT_AUTHORIZED;
      }

      return form;
    },

    async find(findOptions) {
      const { user } = findOptions;
      ensureUserSignedIn(user);
      const options = { ...findOptions, ...{ userId: user.id } };
      return formRepository.find(options);
    },
  };
}
