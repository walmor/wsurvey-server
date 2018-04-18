import supertest from 'supertest';
import app from '../../app';
import * as mongodbInMemory from '../utils/mongodb-in-memory';
import * as err from '../../services/errors/error-constants';
import services from '../../services/';
import '../utils/custom-expects';
import { saveUser } from '../utils/user-factory';
import { saveForms, saveFormWithQuestion } from '../utils/form-factory';

let request;

beforeAll(async () => {
  await mongodbInMemory.init();
  request = supertest(app);
});

afterAll(async () => {
  await mongodbInMemory.stop();
});

beforeEach(async () => {
  await mongodbInMemory.clearDatabase();
});

function sendQuery(query, token) {
  const post = request.post('/graphql').set('Accept', 'application/json');

  const authToken = token ? `Bearer ${token}` : null;

  if (authToken) {
    post.set('Authorization', authToken);
  }

  return post.send(query);
}

async function signinUser() {
  const { authService } = services;
  const password = '123456';
  const user = await saveUser({ password });
  const token = await authService.signin(user.email, password);

  return { user, token };
}

describe('The forms query', async () => {
  describe('when finding user forms', () => {
    function getFindFormsQuery() {
      return {
        query: `
        query {
          forms(input: {
            page: 0
            pageSize: 10              
          }) {
            totalCount
            nodes {
              id
              title
              description
              enabled
              createdAt
              questions {
                id
                title
                description
                required                  
              }
            }
          }
        }
      `,
      };
    }

    it('should return an error if no user is signed in', async () => {
      const query = getFindFormsQuery();
      const token = null;

      const response = await sendQuery(query, token);

      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].code).toEqual(err.USER_NOT_SIGNED_IN.code);
    });

    it('should return the forms of the signed in user', async () => {
      const query = getFindFormsQuery();
      const { user, token } = await signinUser();
      const formsQuantity = 5;
      const forms = await saveForms(user, formsQuantity);
      const expectedIds = forms.map(f => f.id);

      const response = await sendQuery(query, token);

      const returnedForms = response.body.data.forms.nodes;
      const returnedIds = returnedForms.map(rf => rf.id);

      expect(returnedForms).toHaveLength(formsQuantity);
      expect(returnedIds).toEqual(expect.arrayContaining(expectedIds));
    });
  });

  describe('when finding a form by id', async () => {
    function getFindByIdQuery(formId) {
      return {
        query: `
        query {
          form(formId: "${formId}") {
            id
            title
            description
            enabled
            questions {
              id
              title
              description
              required                  
            }                
          }
        }
      `,
      };
    }

    it('should return an error if no user is signed in', async () => {
      const query = getFindByIdQuery('any-id');
      const token = null;

      const response = await sendQuery(query, token);

      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].code).toEqual(err.USER_NOT_SIGNED_IN.code);
    });

    it('should return the form data', async () => {
      const { user, token } = await signinUser();
      const form = await saveFormWithQuestion('ShortAnswer', { title: 'test question' }, user);

      const query = getFindByIdQuery(form.id);

      const response = await sendQuery(query, token);

      const returnedForm = response.body.data.form;

      expect(returnedForm).toBeDefined();
      expect(form).toMatchObject(returnedForm);
    });
  });
});
