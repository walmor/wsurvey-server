import { formSchema } from '../../form';

function registerQuestionKind(name, schema) {
  let questions = formSchema.path('questions');
  return questions.discriminator(name, schema);
}

export default registerQuestionKind;
