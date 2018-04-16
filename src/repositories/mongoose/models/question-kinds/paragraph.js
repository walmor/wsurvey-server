import { Schema } from 'mongoose';
import registerQuestionKind from './utils/register-question-kind';

const paragraphOptions = {
  validation: {
    kind: {
      type: String,
      enum: ['number', 'text', 'length', 'regex'],
    },
    operation: String,
    argument: String,
    errorMessage: String,
  },
};

const paragraphSchema = new Schema({
  options: paragraphOptions,
});

registerQuestionKind('Paragraph', paragraphSchema);

export { paragraphOptions };
