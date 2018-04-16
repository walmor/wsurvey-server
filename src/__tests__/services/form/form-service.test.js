import * as err from '../../../services/errors/error-constants';
import formService from '../../../services/form/form-service';

function getFormService(formRepository) {
  return formService({
    formRepository,
  });
}

describe('The form service', async () => {
  describe('when dealing with authorization', () => {
    const form = { id: '46464' };
    const service = getFormService();
    const operations = [
      { exec: async user => service.create(form, user), msg: 'creating a form' },
      { exec: async user => service.update(form, user), msg: 'updating a form' },
      { exec: async user => service.delete(form.id, user), msg: 'deleting a form' },
      { exec: async user => service.findById(form.id, user), msg: 'finding a form by id' },
      { exec: async user => service.find({ user }), msg: 'searching forms' },
    ];

    operations.forEach((op) => {
      describe(op.msg, async () => {
        it('should throw an authorization error when no user is passed', async () => {
          const user = null;

          const promise = op.exec(user);

          return expect(promise).rejects.toThrowError(err.USER_NOT_SIGNED_IN);
        });

        it('should throw an authorization error when the user is not valid', async () => {
          const user = { id: null };

          const promise = op.exec(user);

          return expect(promise).rejects.toThrowError(err.USER_NOT_SIGNED_IN);
        });
      });
    });
  });

  describe('when creating a new form', async () => {
    it('should save the form and return it', async () => {
      const user = { id: '46464646' };
      const form = { title: 'Test form', description: 'My new test form' };
      const userRepoStub = {
        async create() {
          return form;
        },
      };

      const service = getFormService(userRepoStub);

      const createdForm = await service.create(form, user);

      expect(createdForm).toBe(form);
    });

    it('should assign the form to the user', async () => {
      const user = { id: '46464646' };
      const form = { title: 'Test form', description: 'My new test form' };
      const userRepoStub = {
        async create() {
          return form;
        },
      };

      const service = getFormService(userRepoStub);

      const createdForm = await service.create(form, user);

      expect(createdForm.userId).toBe(user.id);
    });
  });

  describe('when updating a form', async () => {
    it('should throw an error if the form does not have an id', async () => {
      const user = { id: '653214' };
      const form = { id: null };
      const service = getFormService();

      const promise = service.update(form, user);

      return expect(promise).rejects.toThrowError(err.INVALID_OBJECT_ID);
    });

    it('should throw an authorization error if the form does not belong to the user', async () => {
      const user = { id: '653214' };
      const form = { id: '6497955', userId: '123456' };
      const service = getFormService();

      const promise = service.update(form, user);

      return expect(promise).rejects.toThrowError(err.NOT_AUTHORIZED);
    });

    it('should update a form if the access is granted', async () => {
      const user = { id: '46464646' };
      const form = { id: '54646', userId: '46464646', title: 'Updated title' };
      const userRepoStub = {
        async update() {
          return form;
        },
      };

      const service = getFormService(userRepoStub);

      const updatedForm = await service.update(form, user);

      expect(updatedForm).toBe(form);
    });
  });

  describe('when deleting a form', async () => {
    it('should throw an error if the form id is invalid', async () => {
      const user = { id: '653214' };
      const formId = null;
      const service = getFormService();

      const promise = service.delete(formId, user);

      return expect(promise).rejects.toThrowError(err.INVALID_OBJECT_ID);
    });

    it('should throw an authorization error if the form does not belong to the user', async () => {
      const user = { id: '653214' };
      const form = { id: '6497955', userId: '123456' };
      const userRepoStub = {
        async findById() {
          return form;
        },
      };

      const service = getFormService(userRepoStub);

      const promise = service.delete(form.id, user);

      return expect(promise).rejects.toThrowError(err.NOT_AUTHORIZED);
    });

    it('should delete a form if the access is granted', async () => {
      const user = { id: '46464646' };
      const form = { id: '54646', userId: '46464646' };
      const deleteSpy = jest.fn();

      const userRepoStub = {
        async findById() {
          return form;
        },
        async delete(id) {
          deleteSpy(id);
        },
      };

      const service = getFormService(userRepoStub);

      await service.delete(form.id, user);

      expect(deleteSpy).toBeCalledWith(form.id);
    });
  });

  describe('when searching a form by id', async () => {
    it('should throw an authorization error if the form does not belong to the user', async () => {
      const user = { id: '653214' };
      const form = { id: '6497955', userId: '123456' };
      const userRepoStub = {
        async findById() {
          return form;
        },
      };

      const service = getFormService(userRepoStub);

      const promise = service.findById(form.id, user);

      return expect(promise).rejects.toThrowError(err.NOT_AUTHORIZED);
    });

    it('should return the form if the access is granted', async () => {
      const user = { id: '46464646' };
      const form = { id: '54646', userId: '46464646' };

      const userRepoStub = {
        async findById() {
          return form;
        },
      };

      const service = getFormService(userRepoStub);

      const foundForm = await service.findById(form.id, user);

      expect(foundForm).toBe(form);
    });
  });

  describe('when searching user forms', async () => {
    it('should retrieve the user forms', async () => {
      const user = { id: '46464646' };
      const forms = [];
      const baseOpts = {
        page: 0,
        pageSize: 10,
        search: 'test',
      };

      const svcFindOptions = { ...baseOpts, ...{ user } };
      const repoFindOptions = { ...baseOpts, ...{ userId: user.id } };

      let passedOpts = null;
      const userRepoStub = {
        async find(opts) {
          passedOpts = opts;
          return forms;
        },
      };

      const service = getFormService(userRepoStub);

      const foundForms = await service.find(svcFindOptions);

      expect(foundForms).toBe(forms);
      expect(passedOpts).toMatchObject(repoFindOptions);
    });
  });
});
