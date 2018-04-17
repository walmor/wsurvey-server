import formRepository from '../../repositories/mongoose/form-repository';
import { saveUser } from './user-factory';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function saveBareForm(user, props) {
  const form = await getBareForm(user, props);
  return formRepository.create(form);
}

export async function saveForms(user, quantity) {
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

export async function getBareForm(user, props) {
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

export function getBaseQuestion(kind, props) {
  return Object.assign(
    {
      kind,
      title: 'some question',
      description: 'some description',
    },
    props,
  );
}

export async function getFormWithQuestion(kind, props, user) {
  const form = await getBareForm(user);
  const question = getBaseQuestion(kind, props);

  form.questions = [question];

  return { form, question };
}

export async function saveFormWithQuestion(kind, props, user) {
  const { form } = await getFormWithQuestion(kind, props, user);
  return formRepository.create(form);
}
