import * as mongodbInMemory from '../../utils/mongodb-in-memory';
import { saveUser } from '../../utils/user-factory';
import { expectToNotReturnMongooseModels } from '../../utils/custom-expects';
import formRepository from '../../../repositories/mongoose/form-repository';
import '../../../repositories/mongoose/models/question-kinds';

beforeAll(async () => {
  await mongodbInMemory.init();
});

afterAll(async () => {
  await mongodbInMemory.stop();
});

beforeEach(async () => {
  await mongodbInMemory.clearDatabase();
});

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function saveBareForm(user, props) {
  const form = await getBareForm(user, props);
  return formRepository.create(form);
}

async function saveForms(user, quantity) {
  const forms = [];

  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < quantity; i++) {
    // just a small delay to have slightly
    // different creation dates and test sort.
    await delay(20);
    forms.push(await saveBareForm(user));
  }

  return forms;
}

async function getBareForm(user, props) {
  let usr = user;
  if (!usr) {
    usr = await saveUser();
  }

  return Object.assign(
    {
      title: 'test form',
      description: 'just a test form',
      userId: usr.id,
    },
    props,
  );
}

function getBaseQuestion(kind, props) {
  return Object.assign(
    {
      kind,
      title: 'some question',
      description: 'some description',
    },
    props,
  );
}

async function getFormWithQuestion(kind, props) {
  const form = await getBareForm();
  const question = getBaseQuestion(kind, props);

  form.questions = [question];

  return { form, question };
}

function getQuestionTests() {
  const qt = (name, props) => ({ name, props });

  const questions = [
    qt('Paragraph'),
    qt('ShortAnswer', {
      options: {
        validation: {
          kind: 'number',
          operation: 'gt',
          argument: '1',
          errorMessage: 'number should be greater than one',
        },
        mask: '#000',
      },
    }),
    qt('MultipleChoice', {
      options: {
        items: [{ value: 'Item 1' }, { value: 'Others', isOther: true }],
        shuffleOrder: true,
      },
    }),
    qt('DropDown', {
      options: {
        items: [{ value: 'First item' }, { value: 'Second Item' }],
        shuffleOrder: false,
      },
    }),
    qt('CheckBoxList', {
      options: {
        items: [{ value: 'Item 1' }, { value: 'Others', isOther: true }],
        validation: {
          kind: 'atLeast',
          argument: 2,
          errorMessage: 'select at least two options',
        },
      },
    }),
    qt('FileUpload', {
      options: {
        validation: {
          allowedFileExtensions: ['docx', 'pdf'],
          maximumNumberOfFiles: 1,
          maximumFileSize: 10000,
        },
      },
    }),
    qt('LinearScale', {
      options: {
        lowerScaleLimit: 0,
        lowerScaleLabel: 'Min',
        upperScaleLimit: 10,
        upperScaleLabel: 'Max',
      },
    }),
  ];

  return questions;
}

describe('The form repository', async () => {
  describe('when creating a new form', async () => {
    it('should save a bare valid form', async () => {
      const form = await getBareForm();

      const savedForm = await formRepository.create(form);

      expect(savedForm.id).toBeTruthy();
      expect(savedForm.enabled).toBe(true);
      expect(savedForm.createdAt).toBeInstanceOf(Date);
    });

    it('should not save a form without a title', async () => {
      const form = await getBareForm();
      form.title = '';

      expect.assertions(2);

      try {
        await formRepository.create(form);
      } catch (error) {
        expect(error.errors.title).toBeDefined();
        expect(error.errors.title.kind).toBe('required');
      }
    });

    it('should not save a form without an user id', async () => {
      const form = await getBareForm();
      form.userId = null;

      expect.assertions(2);

      try {
        await formRepository.create(form);
      } catch (error) {
        expect(error.errors.userId).toBeDefined();
        expect(error.errors.userId.kind).toBe('required');
      }
    });

    const questions = getQuestionTests();

    questions.forEach((q) => {
      it(`should save a form with a "${q.name}" question`, async () => {
        const { form, question } = await getFormWithQuestion(q.name, q.props);

        const savedForm = await formRepository.create(form);

        expect(savedForm.questions).toHaveLength(1);
        expect(savedForm.questions[0].id).toBeTruthy();
        expect(savedForm.questions[0]).toMatchObject(question);
      });
    });

    it('should throw an error saving a question without a kind', async () => {
      const kind = undefined;
      const { form } = await getFormWithQuestion(kind);

      const promise = formRepository.create(form);

      return expect(promise).rejects.toThrowError('The property kind is required.');
    });

    it('should throw an error saving a question with a not supported kind', async () => {
      const kind = 'any-not-supported-kind';
      const { form } = await getFormWithQuestion(kind);

      const promise = formRepository.create(form);

      return expect(promise).rejects.toThrowError(/The property "kind" has an invalid value/i);
    });
  });

  describe('when updating a form', async () => {
    it('should throw an error if the form id does not exist', async () => {
      const anyInvalidId = '53cb6b9b4f4ddef1ad47f943';
      const form = await getBareForm();
      form.id = anyInvalidId;

      const promise = formRepository.update(form);

      return expect(promise).rejects.toThrow();
    });

    it('should update questions without create new ids', async () => {
      const form = await getBareForm();
      const questionOne = getBaseQuestion('Paragraph');
      const questionTwo = getBaseQuestion('ShortAnswer');

      form.questions = [questionOne, questionTwo];

      const savedForm = await formRepository.create(form);

      questionOne.id = savedForm.questions[0].id;
      questionTwo.id = savedForm.questions[1].id;

      questionOne.title = 'q1 with updated title';
      questionTwo.title = 'q2 with updated title';

      savedForm.questions = [questionOne, questionTwo];

      const updatedForm = await formRepository.update(savedForm);

      expect(updatedForm.questions).toHaveLength(2);
      expect(updatedForm.questions[0]).toMatchObject(questionOne);
      expect(updatedForm.questions[1]).toMatchObject(questionTwo);
    });

    it('should add new questions', async () => {
      const form = await getBareForm();
      const questionOne = getBaseQuestion('Paragraph');

      form.questions = [questionOne];

      const savedForm = await formRepository.create(form);

      const questionTwo = getBaseQuestion('ShortAnswer');

      savedForm.questions.push(questionTwo);

      const updatedForm = await formRepository.update(savedForm);

      expect(updatedForm.questions).toHaveLength(2);
      expect(updatedForm.questions[1]).toMatchObject(questionTwo);
    });

    it('should remove questions', async () => {
      const form = await getBareForm();
      const questionOne = getBaseQuestion('Paragraph');
      const questionTwo = getBaseQuestion('ShortAnswer');

      form.questions = [questionOne, questionTwo];

      const savedForm = await formRepository.create(form);

      savedForm.questions.splice(0, 1);

      const updatedForm = await formRepository.update(savedForm);

      expect(updatedForm.questions).toHaveLength(1);
      expect(updatedForm.questions[0]).toMatchObject(questionTwo);
    });

    it('should remove all the questions it is null', async () => {
      const form = await getBareForm();
      const questionOne = getBaseQuestion('Paragraph');
      const questionTwo = getBaseQuestion('ShortAnswer');

      form.questions = [questionOne, questionTwo];

      const savedForm = await formRepository.create(form);

      savedForm.questions = null;

      const updatedForm = await formRepository.update(savedForm);

      expect(updatedForm.questions).toBeNull();
    });

    it('should not update the createdAt property', async () => {
      const form = await getBareForm();

      const savedForm = await formRepository.create(form);
      const { createdAt } = savedForm;

      savedForm.createdAt = new Date('2010-04-12 10:50');

      const updatedForm = await formRepository.update(savedForm);

      expect(updatedForm.createdAt).toEqual(createdAt);
    });

    it('should not remove the questions if it is undefined', async () => {
      const form = await getBareForm();
      const questionOne = getBaseQuestion('Paragraph');
      const questionTwo = getBaseQuestion('ShortAnswer');

      form.questions = [questionOne, questionTwo];

      const savedForm = await formRepository.create(form);

      delete savedForm.questions;

      const updatedForm = await formRepository.update(savedForm);

      expect(updatedForm.questions).toHaveLength(2);
    });
  });

  describe('when deleting a form', async () => {
    it('should update the deleted property', async () => {
      const form = await saveBareForm();

      await formRepository.delete(form.id);

      const deletedForm = await formRepository.findById(form.id);

      expect(deletedForm.deleted).toBe(true);
    });

    it('should throw an error if the form id does not exist', async () => {
      const anyInvalidId = '53cb6b9b4f4ddef1ad47f943';

      const promise = formRepository.delete(anyInvalidId);

      return expect(promise).rejects.toThrow();
    });
  });

  describe('when searching by id', async () => {
    it('should find an existing form', async () => {
      const form = await saveBareForm();

      const foundForm = await formRepository.findById(form.id);

      expect(foundForm.id).toEqual(form.id);
    });

    it('should return null when there is no matches', async () => {
      const unexistentId = '53cb6b9b4f4ddef1ad47f943';

      const foundForm = await formRepository.findById(unexistentId);

      expect(foundForm).toBeNull();
    });

    it('should return null when the given id is invalid', async () => {
      const invalidId = 'abc';

      const foundForm = await formRepository.findById(invalidId);

      expect(foundForm).toBeNull();
    });
  });

  describe('when searching user forms', async () => {
    it('should throw an error if no user id is passed', async () => {
      const promise = formRepository.find({ page: 0, pageSize: 10 });

      return expect(promise).rejects.toThrowError();
    });

    it('should return the total count', async () => {
      const totalCount = 9;
      const user = await saveUser();

      await saveForms(user, totalCount);

      const result = await formRepository.find({ page: 0, pageSize: 10, userId: user.id });

      expect(result.totalCount).toBe(totalCount);
    });

    it('should search by the form title', async () => {
      const search = 'awesome';

      const user = await saveUser();
      const form1 = await saveBareForm(user, { title: 'My awesome form ' });
      const form2 = await saveBareForm(user, { title: 'Awesome questionary' });

      await saveForms(user, 5);

      const result = await formRepository.find({
        page: 0,
        pageSize: 10,
        userId: user.id,
        search,
      });

      expect(result.forms).toContainEqual(form1);
      expect(result.forms).toContainEqual(form2);
    });

    it('should search by the form description', async () => {
      const search = 'awesome';

      const user = await saveUser();
      const form1 = await saveBareForm(user, { description: 'My awesome form ' });
      const form2 = await saveBareForm(user, { description: 'Awesome questionary' });

      await saveForms(user, 5);

      const result = await formRepository.find({
        page: 0,
        pageSize: 10,
        userId: user.id,
        search,
      });

      expect(result.forms).toContainEqual(form1);
      expect(result.forms).toContainEqual(form2);
    });

    it('should return forms ordered by descending creation date', async () => {
      const totalCount = 5;

      const user = await saveUser();
      const forms = await saveForms(user, totalCount);

      const first = forms[forms.length - 1];
      const last = forms[0];

      const result = await formRepository.find({
        page: 0,
        pageSize: 10,
        userId: user.id,
      });

      expect(result.forms).toHaveLength(totalCount);
      expect(result.forms[0]).toMatchObject(first);
      expect(result.forms[result.forms.length - 1]).toMatchObject(last);
    });

    it('should return a specific page', async () => {
      const page = 1;
      const pageSize = 5;
      const user = await saveUser();

      await saveForms(user, 3);
      const middlePage = await saveForms(user, pageSize);
      await saveForms(user, 5);

      const first = middlePage[middlePage.length - 1];
      const last = middlePage[0];

      const result = await formRepository.find({
        page,
        pageSize,
        userId: user.id,
      });

      expect(result.forms).toHaveLength(pageSize);
      expect(result.forms[0]).toMatchObject(first);
      expect(result.forms[result.forms.length - 1]).toMatchObject(last);
    });

    it('should return at most the given page size', async () => {
      const totalCount = 13;
      const pageSize = 10;

      const user = await saveUser();
      await saveForms(user, totalCount);

      const result = await formRepository.find({
        page: 0,
        pageSize,
        userId: user.id,
      });

      expect(result.totalCount).toEqual(totalCount);
      expect(result.forms).toHaveLength(pageSize);
    });

    it('should not return deleted forms', async () => {
      const user = await saveUser();
      const form1 = await saveBareForm(user, { deleted: true });
      const form2 = await saveBareForm(user, { deleted: true });

      await saveForms(user, 5);

      const result = await formRepository.find({
        page: 0,
        pageSize: 10,
        userId: user.id,
      });

      expect(result.forms).toHaveLength(5);
      expect(result.forms).not.toContainEqual(form1);
      expect(result.forms).not.toContainEqual(form2);
    });

    it('should not return other users forms', async () => {
      const user1 = await saveUser({ email: 'peter@example.com' });
      const user2 = await saveUser({ email: 'jonh@example.com' });

      const user1Form = await saveBareForm(user1);
      const user2form = await saveBareForm(user2);

      const result = await formRepository.find({
        page: 0,
        pageSize: 10,
        userId: user1.id,
      });

      expect(result.forms).toHaveLength(1);
      expect(result.forms).toContainEqual(user1Form);
      expect(result.forms).not.toContainEqual(user2form);
    });
  });

  describe('when returning objects', async () => {
    it('should not return mongoose models', async () => {
      const user = await saveUser();
      const formToCreate = await getBareForm(user);
      const formToUpdate = await saveBareForm(user);
      const findOpts = {
        page: 0,
        pageSize: 10,
        userId: user.id,
      };

      formToCreate.question = [getBaseQuestion('ShortAnswer')];

      const methods = {
        methodsToTest: {
          create: [formToCreate],
          update: [formToUpdate],
          findById: [formToUpdate.id],
          find: [findOpts],
        },
        methodsToIgnore: ['delete'],
      };

      await expectToNotReturnMongooseModels(formRepository, methods);
    });
  });
});
